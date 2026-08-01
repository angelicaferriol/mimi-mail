import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import db from '@/lib/db';
import { createSession } from '@/lib/auth';
import { sendEmail } from '@/lib/mail';
import { checkRateLimit } from '@/lib/rate-limit';

export const runtime = 'edge';

const PIN_EXPIRY_MINUTES = 15;

interface AuthUserRow {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  is_verified: number;
  verification_pin: string | null;
  verification_pin_created_at: string | null;
  verification_pin_attempts: number | null;
  login_attempts: number | null;
}

function pinExpired(createdAt: string | null | undefined) {
  if (!createdAt) return true;
  let normalized = createdAt;
  if (!normalized.includes('T') && !normalized.endsWith('Z')) {
    normalized = normalized.replace(' ', 'T') + 'Z';
  }
  const createdTime = new Date(normalized).getTime();
  if (Number.isNaN(createdTime)) return true;
  return Date.now() - createdTime > PIN_EXPIRY_MINUTES * 60 * 1000;
}

export async function POST(request: Request) {
  try {
    const rateLimit = await checkRateLimit(request, 'auth-login', 10, 10 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const { loginId, password } = await request.json(); // loginId can be email or username

    if (!loginId || !password) {
      return NextResponse.json(
        { error: 'Username/Email and password are required' },
        { status: 400 }
      );
    }

    const cleanLoginId = loginId.trim().toLowerCase();

    // Find user
    const user = await db.get<AuthUserRow>(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      cleanLoginId, cleanLoginId
    );

    if (!user) {
      return NextResponse.json(
        { error: 'Account does not exist' },
        { status: 400 }
      );
    }

    // Verify password
    const validPassword = bcrypt.compareSync(password, user.password_hash);
    if (!validPassword) {
      const newAttempts = (user.login_attempts || 0) + 1;
      await db.run('UPDATE users SET login_attempts = ? WHERE id = ?', newAttempts, user.id);

      return NextResponse.json(
        { 
          error: 'Incorrect password', 
          showForgotPassword: newAttempts >= 3,
          email: user.email
        },
        { status: 400 }
      );
    }

    // Check if verified
    if (user.is_verified === 0) {
      // Regeneate/send verification pin if null
      let pin = user.verification_pin;
      if (!pin || pinExpired(user.verification_pin_created_at)) {
        pin = Math.floor(100000 + Math.random() * 900000).toString();
        await db.run(
          'UPDATE users SET verification_pin = ?, verification_pin_created_at = ?, verification_pin_attempts = 0 WHERE id = ?',
          pin, new Date().toISOString(), user.id
        );
      }

      await sendEmail({
        to: user.email,
        subject: '[Mimi Mail] Verify Your Account',
        text: `Your Mimi Mail verification code is: ${pin}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #555; border-bottom: 2px solid #EBE7E4; padding-bottom: 10px;">Verify Your Mimi Mail Account</h2>
            <p>Please use the verification PIN below to activate your account:</p>
            <h1 style="background-color: #F7F3EE; padding: 15px; border-left: 4px solid #8A8480; font-size: 32px; letter-spacing: 4px; text-align: center; font-family: monospace; color: #333; font-weight: bold;">${pin}</h1>
          </div>
        `
      });

      return NextResponse.json(
        { error: 'Please verify your email address to log in', needsVerification: true, email: user.email },
        { status: 400 }
      );
    }

    // Reset login attempts
    await db.run('UPDATE users SET login_attempts = 0 WHERE id = ?', user.id);

    // Create session
    await createSession({
      userId: user.id,
      username: user.username,
      email: user.email,
    });

    return NextResponse.json({ success: true, username: user.username });
  } catch (error: unknown) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

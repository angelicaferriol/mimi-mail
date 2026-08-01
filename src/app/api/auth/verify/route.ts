import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { createSession } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';

export const runtime = 'edge';

const PIN_EXPIRY_MINUTES = 15;
const MAX_PIN_ATTEMPTS = 5;

interface VerificationUserRow {
  id: number;
  username: string;
  email: string;
  verification_pin: string | null;
  verification_pin_created_at: string | null;
  verification_pin_attempts: number | null;
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
    const rateLimit = await checkRateLimit(request, 'auth-verify', 8, 15 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many verification attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const { email, pin } = await request.json();

    if (!email || !pin) {
      return NextResponse.json(
        { error: 'Email and verification code are required' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPin = pin.trim();

    // Find user
    const user = await db.get<VerificationUserRow>('SELECT * FROM users WHERE email = ?', cleanEmail);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 400 }
      );
    }

    if (!user.verification_pin || pinExpired(user.verification_pin_created_at)) {
      await db.run(
        'UPDATE users SET verification_pin = NULL, verification_pin_created_at = NULL, verification_pin_attempts = 0 WHERE id = ?',
        user.id
      );
      return NextResponse.json(
        { error: 'Verification code expired. Request a new one.' },
        { status: 400 }
      );
    }

    const attempts = Number(user.verification_pin_attempts || 0);
    if (attempts >= MAX_PIN_ATTEMPTS) {
      await db.run(
        'UPDATE users SET verification_pin = NULL, verification_pin_created_at = NULL, verification_pin_attempts = 0 WHERE id = ?',
        user.id
      );
      return NextResponse.json(
        { error: 'Too many attempts. Request a new verification code.' },
        { status: 429 }
      );
    }

    if (user.verification_pin !== cleanPin) {
      await db.run(
        'UPDATE users SET verification_pin_attempts = verification_pin_attempts + 1 WHERE id = ?',
        user.id
      );
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      );
    }

    // Update user status
    await db.run(
      'UPDATE users SET is_verified = 1, verification_pin = NULL, verification_pin_created_at = NULL, verification_pin_attempts = 0, login_attempts = 0 WHERE id = ?',
      user.id
    );

    // Create session
    await createSession({
      userId: user.id,
      username: user.username,
      email: user.email,
    });

    return NextResponse.json({ success: true, username: user.username });
  } catch (error: unknown) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
export async function PUT(request: Request) {
  // Resend PIN
  try {
    const rateLimit = await checkRateLimit(request, 'auth-verify-resend', 5, 15 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many resend attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await db.get<VerificationUserRow>('SELECT * FROM users WHERE email = ?', cleanEmail);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 400 });
    }

    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    await db.run(
      'UPDATE users SET verification_pin = ?, verification_pin_created_at = ?, verification_pin_attempts = 0 WHERE id = ?',
      pin, new Date().toISOString(), user.id
    );

    const { sendEmail } = await import('@/lib/mail');
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

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Resend PIN error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

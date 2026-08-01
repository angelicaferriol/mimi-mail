import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import db from '@/lib/db';
import { sendEmail } from '@/lib/mail';
import { checkRateLimit } from '@/lib/rate-limit';

export const runtime = 'edge';

interface ExistingUserRow {
  id: number;
}

export async function POST(request: Request) {
  try {
    const rateLimit = await checkRateLimit(request, 'auth-register', 5, 60 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many registrations from this device. Please try again later.' },
        { status: 429 }
      );
    }

    const { username, email, password } = await request.json();

    if (!username || !email || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (cleanUsername.length < 3) {
      return NextResponse.json(
        { error: 'Username must be at least 3 characters long and alphanumeric' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.get<ExistingUserRow>(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      cleanUsername, email.toLowerCase()
    );
    if (existingUser) {
      return NextResponse.json(
        { error: 'Username or email already registered' },
        { status: 400 }
      );
    }

    // Hash password
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    // Generate 6-digit verification PIN
    const verificationPin = Math.floor(100000 + Math.random() * 900000).toString();

    // Insert user
    await db.run(
      'INSERT INTO users (username, email, password_hash, is_verified, verification_pin, verification_pin_created_at) VALUES (?, ?, ?, ?, ?, ?)',
      cleanUsername, email.toLowerCase(), passwordHash, 0, verificationPin, new Date().toISOString()
    );

    // Send verification email
    await sendEmail({
      to: email.toLowerCase(),
      subject: '[Mimi Mail] Verify Your Account',
      text: `Your Mimi Mail verification code is: ${verificationPin}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #555; border-bottom: 2px solid #EBE7E4; padding-bottom: 10px;">Verify Your Mimi Mail Account</h2>
          <p>Thank you for signing up for Mimi Mail! Please use the verification PIN below to activate your account:</p>
          <h1 style="background-color: #F7F3EE; padding: 15px; border-left: 4px solid #8A8480; font-size: 32px; letter-spacing: 4px; text-align: center; font-family: monospace; color: #333; font-weight: bold;">${verificationPin}</h1>
          <p style="color: #6E6865; font-size: 12px; margin-top: 20px;">If you did not request this, you can safely ignore this email.</p>
        </div>
      `
    });

    return NextResponse.json({ success: true, needsVerification: true, email: email.toLowerCase() });
  } catch (error: unknown) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { sendEmail } from '@/lib/mail';
import { checkRateLimit } from '@/lib/rate-limit';

export const runtime = 'edge';

interface ResetUserRow {
  id: number;
  email: string;
}

export async function POST(request: Request) {
  try {
    const rateLimit = await checkRateLimit(request, 'auth-forgot-password', 5, 15 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many reset requests. Please try again later.' },
        { status: 429 }
      );
    }

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Find user
    const user = await db.get<ResetUserRow>('SELECT id, email FROM users WHERE email = ?', cleanEmail);

    if (!user) {
      // Return success even if email not registered to prevent email enumeration
      return NextResponse.json({ success: true });
    }

    // Generate reset PIN
    const resetPin = Math.floor(100000 + Math.random() * 900000).toString();

    await db.run(
      'UPDATE users SET reset_pin = ?, reset_pin_created_at = ?, reset_pin_attempts = 0 WHERE id = ?',
      resetPin, new Date().toISOString(), user.id
    );

    // Send email
    await sendEmail({
      to: user.email,
      subject: '[Mimi Mail] Reset Your Password',
      text: `Your Mimi Mail password reset verification code is: ${resetPin}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #555; border-bottom: 2px solid #EBE7E4; padding-bottom: 10px;">Reset Your Password</h2>
          <p>We received a request to reset your password. Please use the verification PIN below to proceed:</p>
          <h1 style="background-color: #F7F3EE; padding: 15px; border-left: 4px solid #8A8480; font-size: 32px; letter-spacing: 4px; text-align: center; font-family: monospace; color: #333; font-weight: bold;">${resetPin}</h1>
          <p style="color: #6E6865; font-size: 12px; margin-top: 20px;">If you did not make this request, you can safely ignore this email.</p>
        </div>
      `
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

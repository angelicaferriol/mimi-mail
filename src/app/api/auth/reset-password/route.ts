import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import db from '@/lib/db';
import { checkRateLimit } from '@/lib/rate-limit';

const PIN_EXPIRY_MINUTES = 15;
const MAX_PIN_ATTEMPTS = 5;

interface ResetUserRow {
  id: number;
  reset_pin: string | null;
  reset_pin_created_at: string | null;
  reset_pin_attempts: number | null;
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
    const rateLimit = checkRateLimit(request, 'auth-reset-password', 5, 15 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many reset attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const { email, pin, password } = await request.json();

    if (!email || !pin || !password) {
      return NextResponse.json(
        { error: 'Email, reset code, and new password are required' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPin = pin.trim();

    // Find user
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail) as ResetUserRow | undefined;

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 400 }
      );
    }

    if (!user.reset_pin || pinExpired(user.reset_pin_created_at)) {
      db.prepare(
        'UPDATE users SET reset_pin = NULL, reset_pin_created_at = NULL, reset_pin_attempts = 0 WHERE id = ?'
      ).run(user.id);
      return NextResponse.json(
        { error: 'Reset code expired. Request a new one.' },
        { status: 400 }
      );
    }

    const attempts = Number(user.reset_pin_attempts || 0);
    if (attempts >= MAX_PIN_ATTEMPTS) {
      db.prepare(
        'UPDATE users SET reset_pin = NULL, reset_pin_created_at = NULL, reset_pin_attempts = 0 WHERE id = ?'
      ).run(user.id);
      return NextResponse.json(
        { error: 'Too many attempts. Request a new reset code.' },
        { status: 429 }
      );
    }

    if (user.reset_pin !== cleanPin) {
      db.prepare(
        'UPDATE users SET reset_pin_attempts = reset_pin_attempts + 1 WHERE id = ?'
      ).run(user.id);
      return NextResponse.json(
        { error: 'Invalid reset code' },
        { status: 400 }
      );
    }

    // Hash password
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    // Update password, clear reset PIN, clear login attempts
    db.prepare(
      'UPDATE users SET password_hash = ?, reset_pin = NULL, reset_pin_created_at = NULL, reset_pin_attempts = 0, login_attempts = 0 WHERE id = ?'
    ).run(passwordHash, user.id);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

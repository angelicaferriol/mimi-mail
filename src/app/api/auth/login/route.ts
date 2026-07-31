import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import db from '@/lib/db';
import { createSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { loginId, password } = await request.json(); // loginId can be email or username

    if (!loginId || !password) {
      return NextResponse.json(
        { error: 'Username/Email and password are required' },
        { status: 400 }
      );
    }

    const cleanLoginId = loginId.trim().toLowerCase();

    // Find user
    const user = db.prepare(
      'SELECT * FROM users WHERE username = ? OR email = ?'
    ).get(cleanLoginId, cleanLoginId) as any;

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 400 }
      );
    }

    // Verify password
    const validPassword = bcrypt.compareSync(password, user.password_hash);
    if (!validPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 400 }
      );
    }

    // Create session
    await createSession({
      userId: user.id,
      username: user.username,
      email: user.email,
    });

    return NextResponse.json({ success: true, username: user.username });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

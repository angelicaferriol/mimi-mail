import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import db from '@/lib/db';
import { createSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
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
    const existingUser = db.prepare('SELECT * FROM users WHERE username = ? OR email = ?').get(cleanUsername, email.toLowerCase()) as any;
    if (existingUser) {
      return NextResponse.json(
        { error: 'Username or email already registered' },
        { status: 400 }
      );
    }

    // Hash password
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    // Insert user
    const insert = db.prepare(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)'
    ).run(cleanUsername, email.toLowerCase(), passwordHash);

    const userId = insert.lastInsertRowid as number;

    // Create session
    await createSession({
      userId,
      username: cleanUsername,
      email: email.toLowerCase(),
    });

    return NextResponse.json({ success: true, username: cleanUsername });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

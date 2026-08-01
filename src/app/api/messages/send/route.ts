import { NextResponse } from 'next/server';
import db from '@/lib/db';

interface RecipientRow {
  id: number;
}

export async function POST(request: Request) {
  try {
    const { username, messageText } = await request.json();

    if (!username || !messageText) {
      return NextResponse.json(
        { error: 'Recipient and message content are required' },
        { status: 400 }
      );
    }

    if (messageText.trim().length > 500) {
      return NextResponse.json(
        { error: 'Message cannot exceed 500 characters' },
        { status: 400 }
      );
    }

    // Find recipient user
    const user = db.prepare('SELECT id FROM users WHERE username = ?').get(username.trim().toLowerCase()) as RecipientRow | undefined;
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Insert anonymous message
    db.prepare(
      'INSERT INTO messages (recipient_id, message_text) VALUES (?, ?)'
    ).run(user.id, messageText.trim());

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Message send error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { checkRateLimit } from '@/lib/rate-limit';

export const runtime = 'edge';

interface RecipientRow {
  id: number;
}

export async function POST(request: Request) {
  try {
    const rateLimit = await checkRateLimit(request, 'message-send', 5, 10 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many messages sent. Please try again later.' },
        { status: 429 }
      );
    }
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
    const user = await db.get<RecipientRow>('SELECT id FROM users WHERE username = ?', username.trim().toLowerCase());
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Insert anonymous message
    await db.run(
      'INSERT INTO messages (recipient_id, message_text) VALUES (?, ?)',
      user.id, messageText.trim()
    );

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Message send error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

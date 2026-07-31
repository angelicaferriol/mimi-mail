import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { messageId, replyText } = await request.json();

    if (!messageId) {
      return NextResponse.json(
        { error: 'Message ID is required' },
        { status: 400 }
      );
    }

    // Verify ownership of the message
    const message = db.prepare(
      'SELECT * FROM messages WHERE id = ?'
    ).get(messageId) as any;

    if (!message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    if (message.recipient_id !== session.userId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Update with reply
    db.prepare(
      'UPDATE messages SET reply_text = ?, is_answered = 1, answered_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).run(replyText ? replyText.trim() : null, messageId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Message reply error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

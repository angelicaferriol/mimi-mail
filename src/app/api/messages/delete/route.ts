import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

export const runtime = 'edge';

interface MessageRow {
  id: number;
  recipient_id: number;
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { messageId } = await request.json();

    if (!messageId) {
      return NextResponse.json(
        { error: 'Message ID is required' },
        { status: 400 }
      );
    }

    // Verify ownership of the message
    const message = await db.get<MessageRow>(
      'SELECT id, recipient_id FROM messages WHERE id = ?',
      messageId
    );

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

    // Delete the message
    await db.run('DELETE FROM messages WHERE id = ?', messageId);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Message deletion error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

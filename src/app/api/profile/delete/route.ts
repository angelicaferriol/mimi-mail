import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession, clearSession } from '@/lib/auth';

export const runtime = 'edge';

export async function POST() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Delete user from database (this will cascade delete all their messages)
    await db.run('DELETE FROM users WHERE id = ?', session.userId);

    // Clear user session cookie
    await clearSession();

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Account deletion error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

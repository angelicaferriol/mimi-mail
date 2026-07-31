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

    const { displayName, bio } = await request.json();

    // Update profile fields
    db.prepare(
      'UPDATE users SET display_name = ?, bio = ? WHERE id = ?'
    ).run(
      displayName ? displayName.trim() : null,
      bio ? bio.trim() : null,
      session.userId
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import db from '@/lib/db';
import DashboardClient from './DashboardClient';

interface MessageRow {
  id: number;
  message_text: string;
  reply_text: string | null;
  is_answered: number;
  created_at: string;
  answered_at: string | null;
}

interface UserRow {
  display_name: string | null;
  bio: string | null;
}

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect('/');
  }

  // Fetch all messages for the current user, newest first
  const messages = await db.all<MessageRow>(
    'SELECT id, message_text, reply_text, is_answered, created_at, answered_at FROM messages WHERE recipient_id = ? ORDER BY created_at DESC',
    session.userId
  );

  const { toUtcIso } = await import('@/lib/date-utils');

  // Normalize JSON dates and variables for Client Component
  const serializedMessages = messages.map(msg => ({
    id: msg.id,
    message_text: msg.message_text,
    reply_text: msg.reply_text,
    is_answered: msg.is_answered,
    created_at: toUtcIso(msg.created_at) || '',
    answered_at: toUtcIso(msg.answered_at),
  }));

  // Fetch user settings
  const user = await db.get<UserRow>(
    'SELECT display_name, bio FROM users WHERE id = ?',
    session.userId
  );

  return (
    <DashboardClient 
      username={session.username} 
      initialMessages={serializedMessages} 
      initialDisplayName={user?.display_name || ''}
      initialBio={user?.bio || ''}
    />
  );
}

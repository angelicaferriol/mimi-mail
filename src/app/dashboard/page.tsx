import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import db from '@/lib/db';
import DashboardClient from './DashboardClient';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect('/');
  }

  // Fetch all messages for the current user, newest first
  const messages = db.prepare(
    'SELECT id, message_text, reply_text, is_answered, created_at FROM messages WHERE recipient_id = ? ORDER BY created_at DESC'
  ).all(session.userId) as any[];

  // Normalize JSON dates and variables for Client Component
  const serializedMessages = messages.map(msg => ({
    id: msg.id,
    message_text: msg.message_text,
    reply_text: msg.reply_text,
    is_answered: msg.is_answered,
    created_at: msg.created_at,
  }));

  return (
    <DashboardClient 
      username={session.username} 
      initialMessages={serializedMessages} 
    />
  );
}

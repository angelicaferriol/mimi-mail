import Link from 'next/link';
import db from '@/lib/db';
import ProfileClient from './ProfileClient';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ username: string }>;
}

export default async function ProfilePage({ params }: PageProps) {
  const { username } = await params;
  const cleanUsername = username.toLowerCase();

  // Find user in database
  const user = db.prepare(
    'SELECT id, username, display_name, bio FROM users WHERE username = ?'
  ).get(cleanUsername) as { id: number; username: string; display_name: string | null; bio: string | null } | undefined;

  if (!user) {
    return (
      <main className="desktop">
        <section className="retro-window" style={{ maxWidth: "420px", marginTop: "10%" }}>
          <div className="window-titlebar" style={{ backgroundColor: "#D9534F" }}>
            <div className="window-title" style={{ color: "#FFF" }}>
              Error 404
            </div>
          </div>
          <div className="window-body" style={{ textAlign: "center", padding: "30px 20px" }}>
            <h2 style={{ fontSize: "18px", marginBottom: "12px", fontWeight: 800 }}>User Not Found</h2>
            <p style={{ fontSize: "14px", color: "#6E6865", marginBottom: "20px", fontWeight: 500 }}>
              The profile folder for <strong>u/{username}</strong> does not exist on our servers!
            </p>
            <Link href="/" className="retro-btn btn-white" style={{ display: "inline-block" }}>
              Go Back Home
            </Link>
          </div>
        </section>
      </main>
    );
  }

  // Load answered messages
  const answers = db.prepare(
    'SELECT id, message_text, reply_text, created_at, answered_at FROM messages WHERE recipient_id = ? AND is_answered = 1 ORDER BY answered_at DESC'
  ).all(user.id) as { id: number; message_text: string; reply_text: string; created_at: string; answered_at: string }[];

  const { toUtcIso } = await import('@/lib/date-utils');

  // Normalize JSON dates and variables for Client Component
  const serializedAnswers = answers.map(ans => ({
    id: ans.id,
    message_text: ans.message_text,
    reply_text: ans.reply_text,
    created_at: toUtcIso(ans.created_at) || '',
    answered_at: toUtcIso(ans.answered_at) || '',
  }));

  return (
    <ProfileClient 
      username={user.username} 
      initialAnswers={serializedAnswers} 
      displayName={user.display_name || ''}
      bio={user.bio || ''}
    />
  );
}

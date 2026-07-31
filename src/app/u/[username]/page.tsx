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
  const user = db.prepare('SELECT id, username FROM users WHERE username = ?').get(cleanUsername) as any;

  if (!user) {
    return (
      <main className="desktop">
        <section className="retro-window" style={{ maxWidth: "450px", marginTop: "10%" }}>
          <div className="window-titlebar" style={{ backgroundColor: "#D9534F" }}>
            <div className="window-title">
              <span>⚠️</span> Error 404
            </div>
            <div className="window-controls">
              <button className="window-btn">-</button>
              <button className="window-btn">▢</button>
              <button className="window-btn close-btn">✕</button>
            </div>
          </div>
          <div className="window-body" style={{ textAlign: "center", padding: "30px 20px" }}>
            <h2 style={{ fontSize: "20px", marginBottom: "12px" }}>User Not Found</h2>
            <p style={{ fontSize: "14px", color: "#666", marginBottom: "20px" }}>
              The profile folder for <strong>u/{username}</strong> does not exist on our servers!
            </p>
            <a href="/" className="retro-btn btn-peach" style={{ display: "inline-block" }}>
              Go Back Home
            </a>
          </div>
        </section>
      </main>
    );
  }

  // Load answered messages
  const answers = db.prepare(
    'SELECT id, message_text, reply_text, created_at, answered_at FROM messages WHERE recipient_id = ? AND is_answered = 1 ORDER BY answered_at DESC'
  ).all(user.id) as any[];

  // Normalize JSON dates and variables for Client Component
  const serializedAnswers = answers.map(ans => ({
    id: ans.id,
    message_text: ans.message_text,
    reply_text: ans.reply_text,
    created_at: ans.created_at,
    answered_at: ans.answered_at,
  }));

  return (
    <ProfileClient 
      username={user.username} 
      initialAnswers={serializedAnswers} 
    />
  );
}

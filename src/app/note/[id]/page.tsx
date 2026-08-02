import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import db from '@/lib/db';
import ThemeSync from './ThemeSync';

export const runtime = 'edge';

interface NotePageProps {
  params: Promise<{ id: string }>;
}

interface NoteData {
  id: number;
  message_text: string;
  reply_text: string | null;
  is_answered: number;
  created_at: string;
  answered_at: string | null;
  username: string;
  display_name: string | null;
  theme: string | null;
  letter_number: number;
}

async function getNote(id: string): Promise<NoteData | null> {
  const noteId = parseInt(id, 10);
  if (isNaN(noteId)) return null;

  const note = await db.get<NoteData>(
    `SELECT m.id, m.message_text, m.reply_text, m.is_answered, m.created_at, m.answered_at,
            u.username, u.display_name, u.theme,
            (SELECT COUNT(*) FROM messages m2 WHERE m2.recipient_id = m.recipient_id AND m2.id <= m.id) as letter_number
     FROM messages m
     JOIN users u ON m.recipient_id = u.id
     WHERE m.id = ?`,
     noteId
  );
  return note || null;
}

export async function generateMetadata({ params }: NotePageProps): Promise<Metadata> {
  const { id } = await params;
  const note = await getNote(id);

  if (!note) {
    return {
      title: 'Note Not Found | Mimi Mail',
    };
  }

  const headersList = await headers();
  const host = headersList.get('host') || 'mimi-mail.pages.dev';
  const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
  const protocol = isLocal ? 'http' : 'https';
  const svgUrl = `${protocol}://${host}/api/note/${note.id}/image`;
  const imageUrl = isLocal
    ? svgUrl
    : `https://images.weserv.nl/?url=${encodeURIComponent(svgUrl)}&output=png`;

  const displayName = note.display_name || note.username;
  const noteTitle = note.is_answered && note.reply_text
    ? `Answered Note #${note.letter_number}`
    : `Note #${note.letter_number}`;
  const description = note.is_answered && note.reply_text
    ? `"${note.message_text}" — Replied by ${displayName}`
    : `Read this cute anonymous note on Mimi Mail!`;

  return {
    title: `${noteTitle} | Mimi Mail`,
    description,
    openGraph: {
      title: `${noteTitle} | Mimi Mail`,
      description,
      images: [
        {
          url: imageUrl,
          width: 600,
          height: 400,
          alt: `Mimi Mail ${noteTitle}`,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${noteTitle} | Mimi Mail`,
      description,
      images: [imageUrl],
    },
  };
}

export default async function NotePage({ params }: NotePageProps) {
  const { id } = await params;
  const note = await getNote(id);

  if (!note) {
    notFound();
  }

  const displayName = note.display_name || note.username;
  const themeClass = note.theme || 'theme-peach';
  const title = note.is_answered === 1 && note.reply_text ? `Answered Note #${note.letter_number}` : `Note #${note.letter_number}`;

  return (
    <main className="desktop">
      {/* Client component to sync body class theme safely in React 19 */}
      <ThemeSync theme={themeClass} />

      {/* Header/Navbar */}
      <header className="taskbar" style={{ maxWidth: '480px' }}>
        <Link href="/" className="logo-container" style={{ textDecoration: 'none', color: 'inherit' }}>
          <img src="/icon.png" alt="Mimi Mail Logo" style={{ width: '32px', height: '32px', objectFit: 'contain', mixBlendMode: 'multiply' }} />
          <span className="logo-text">Mimi Mail</span>
        </Link>
        <div className="nav-links">
          <Link href={`/u/${note.username}`} className="retro-btn btn-white" style={{ padding: '5px 12px', fontSize: '12px' }}>
            Write Note
          </Link>
        </div>
      </header>

      {/* Main Card */}
      <div style={{ width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <section className="retro-window">
          <div className="window-titlebar" style={{ backgroundColor: 'var(--accent-primary)' }}>
            <div className="window-title">{title}</div>
          </div>
          <div className="window-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Question Content */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ fontSize: '15px', fontWeight: 500, lineHeight: 1.5, color: 'var(--border-color)' }}>
                “{note.message_text}”
              </div>
              <div style={{ fontSize: '11px', color: '#8A8480' }}>
                Sent: {new Date(note.created_at).toLocaleString()}
              </div>
            </div>

            {/* Answer Section */}
            {note.is_answered === 1 && note.reply_text ? (
              <div style={{ 
                borderLeft: '3.5px solid var(--accent-primary)', 
                paddingLeft: '12px', 
                marginTop: '4px',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px'
              }}>
                <div>
                  <span style={{ fontWeight: 800, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#7A706B', marginRight: '14px' }}>
                    {displayName}:
                  </span>
                  <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--border-color)' }}>{note.reply_text}</span>
                </div>
                <div style={{ fontSize: '11px', color: '#8A8480' }}>
                  Replied: {note.answered_at ? new Date(note.answered_at).toLocaleString() : ''}
                </div>
              </div>
            ) : (
              <div style={{ 
                borderLeft: '3.5px dashed #8A8480', 
                paddingLeft: '12px', 
                marginTop: '16px',
                display: 'flex',
                alignItems: 'center',
                color: '#8A8480',
                fontWeight: 500,
                fontSize: '13px',
                fontStyle: 'italic'
              }}>
                Awaiting reply from {displayName}...
              </div>
            )}
          </div>
        </section>

        {/* Action Button to create their own */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
          <Link href="/?mode=register" className="retro-btn btn-primary" style={{ padding: '10px 24px', fontSize: '14px' }}>
            Create Your Own Mailbox
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="footer" style={{ maxWidth: '480px' }}>
        <div>&copy; 2026 Mimi Mail. All rights reserved.</div>
        <div className="footer-links">
          <Link href="/about" className="footer-link">About Us</Link>
          <Link href="/terms" className="footer-link">Terms</Link>
          <Link href="/contact" className="footer-link">Contact Us</Link>
        </div>
      </footer>
    </main>
  );
}

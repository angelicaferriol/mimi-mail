import db from '@/lib/db';
import { ImageResponse } from 'next/og';

export const runtime = 'edge';

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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const noteId = parseInt(id, 10);
    if (isNaN(noteId)) {
      return new Response('Invalid Note ID', { status: 400 });
    }

    const note = await db.get<NoteData>(
      `SELECT m.id, m.message_text, m.reply_text, m.is_answered, m.created_at, m.answered_at,
              u.username, u.display_name, u.theme,
              (SELECT COUNT(*) FROM messages m2 WHERE m2.recipient_id = m.recipient_id AND m2.id <= m.id) as letter_number
       FROM messages m
       JOIN users u ON m.recipient_id = u.id
       WHERE m.id = ?`,
      noteId
    );

    if (!note) {
      return new Response('Note Not Found', { status: 404 });
    }

    // Map theme names to hex colors
    const themeColors: Record<string, string> = {
      'theme-peach': '#FCD9D2',
      'theme-green': '#D3ECE1',
      'theme-purple': '#E7E1F5',
      'theme-yellow': '#FEECD0',
    };

    const activeTheme = note.theme || 'theme-peach';
    const themeColor = themeColors[activeTheme] || themeColors['theme-peach'];
    const askedDate = new Date(note.created_at).toLocaleString();

    return new ImageResponse(
      (
        <div
          style={{
            width: '600px',
            height: '400px',
            backgroundColor: '#FDFBF7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Card Shadow Container */}
          <div style={{ display: 'flex', position: 'relative', width: '520px' }}>
            {/* Solid Offset Shadow */}
            <div
              style={{
                position: 'absolute',
                top: '8px',
                left: '8px',
                right: '-8px',
                bottom: '-8px',
                backgroundColor: '#2C221E',
                borderRadius: '24px',
              }}
            />

            {/* Main Card */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                width: '520px',
                backgroundColor: '#FFFFFF',
                border: '3px solid #2C221E',
                borderRadius: '24px',
                overflow: 'hidden',
              }}
            >
              {/* Titlebar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 24px',
                  height: '56px',
                  backgroundColor: themeColor,
                  borderBottom: '3px solid #2C221E',
                }}
              >
                <span
                  style={{
                    color: '#2C221E',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    fontFamily: 'sans-serif',
                  }}
                >
                  Note #{note.letter_number}
                </span>
              </div>

              {/* Content body */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '32px',
                  gap: '16px',
                }}
              >
                <span
                  style={{
                    color: '#2C221E',
                    fontSize: '16px',
                    fontWeight: 500,
                    lineHeight: 1.4,
                    fontFamily: 'sans-serif',
                  }}
                >
                  “{note.message_text}”
                </span>
                <span
                  style={{
                    color: '#8A8480',
                    fontSize: '11px',
                    fontFamily: 'sans-serif',
                  }}
                >
                  Sent: {askedDate}
                </span>
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 600,
        height: 400,
      }
    );
  } catch (error: any) {
    console.error('Image generation error:', error);
    return new Response('Error generating image', { status: 500 });
  }
}

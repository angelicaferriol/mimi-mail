import { ImageResponse } from 'next/og';
import db from '@/lib/db';

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
              u.username, u.display_name, u.theme
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
    const displayName = note.display_name || note.username;

    // Render retro card layout
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#FDFBF7',
            padding: '40px',
            fontFamily: 'sans-serif',
          }}
        >
          {/* Card Wrapper */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: '520px',
              backgroundColor: '#FFFFFF',
              border: '3px solid #2C221E',
              borderRadius: '24px',
              boxShadow: '8px 8px 0px #2C221E',
              overflow: 'hidden',
            }}
          >
            {/* Titlebar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: themeColor,
                borderBottom: '3px solid #2C221E',
                padding: '16px 24px',
              }}
            >
              <div
                style={{
                  fontSize: '22px',
                  fontWeight: 'bold',
                  color: '#2C221E',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                Anonymous Note #{note.id}
              </div>
            </div>

            {/* Window Body */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                padding: '32px',
                gap: '16px',
              }}
            >

              {/* Question Content */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ fontSize: '15px', fontWeight: '500', color: '#2C221E', lineHeight: '1.4' }}>
                  “{note.message_text}”
                </div>
                <div style={{ fontSize: '11px', color: '#8A8480' }}>
                  Asked: {new Date(note.created_at).toLocaleString()}
                </div>
              </div>

              {/* Answer bubble */}
              {note.is_answered === 1 && note.reply_text ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    borderLeft: `3.5px solid ${themeColor}`,
                    paddingLeft: '12px',
                    marginTop: '4px',
                    gap: '2px',
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 800, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#7A706B', marginRight: '8px' }}>
                      {displayName}:
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#2C221E' }}>{note.reply_text}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#8A8480' }}>
                    Answered: {note.answered_at ? new Date(note.answered_at).toLocaleString() : ""}
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    borderLeft: '3.5px dashed #8A8480',
                    paddingLeft: '12px',
                    marginTop: '4px',
                    color: '#8A8480',
                    fontWeight: 500,
                    fontSize: '13px',
                    fontStyle: 'italic',
                  }}
                >
                  Awaiting reply...
                </div>
              )}
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
    console.error('OG Image generation error:', error);
    return new Response('Error generating image', { status: 500 });
  }
}

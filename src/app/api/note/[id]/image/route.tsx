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
  letter_number: number;
}


// Simple text wrapper to split content into lines for SVG
function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + word).length > maxChars) {
      lines.push(currentLine.trim());
      currentLine = word + ' ';
    } else {
      currentLine += word + ' ';
    }
  }
  if (currentLine) {
    lines.push(currentLine.trim());
  }
  return lines;
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
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
    const displayName = escapeXml(note.display_name || note.username);
    
    // Wrap message and reply text
    const messageLines = wrapText(`“${note.message_text}”`, 52).map(escapeXml);
    const replyLines = note.reply_text ? wrapText(note.reply_text, 52).map(escapeXml) : [];

    // Layout configuration
    const cardX = 40;
    const cardY = 40;
    const cardWidth = 520;
    const cardHeight = 320;
    const titlebarHeight = 56;
    
    // Render content dynamic coordinates
    let contentY = cardY + titlebarHeight + 36;
    let svgElements = '';

    // Render message lines
    messageLines.forEach((line) => {
      svgElements += `<text x="${cardX + 32}" y="${contentY}" fill="#2C221E" font-size="15" font-weight="500" font-family="sans-serif">${line}</text>`;
      contentY += 22;
    });

    // Date
    const askedDate = new Date(note.created_at).toLocaleString();
    svgElements += `<text x="${cardX + 32}" y="${contentY}" fill="#8A8480" font-size="11" font-family="sans-serif">Sent: ${askedDate}</text>`;
    contentY += 28;

    // Answer/Reply Section
    if (note.is_answered === 1 && replyLines.length > 0) {
      const lineStartY = contentY - 12;
      let replyTextElements = '';
      
      // First line includes the display name with extra spacing
      const firstLine = replyLines[0];
      replyTextElements += `
        <text x="${cardX + 46}" y="${contentY}" font-family="sans-serif">
          <tspan fill="#7A706B" font-size="11" font-weight="800" letter-spacing="0.5">${displayName.toUpperCase()}:    </tspan>
          <tspan fill="#2C221E" font-size="14" font-weight="500">${firstLine}</tspan>
        </text>
      `;
      contentY += 20;

      // Remaining lines
      for (let i = 1; i < replyLines.length; i++) {
        replyTextElements += `<text x="${cardX + 46}" y="${contentY}" fill="#2C221E" font-size="14" font-weight="500" font-family="sans-serif">${replyLines[i]}</text>`;
        contentY += 20;
      }

      // Date answered
      const answeredDate = note.answered_at ? new Date(note.answered_at).toLocaleString() : '';
      replyTextElements += `<text x="${cardX + 46}" y="${contentY}" fill="#8A8480" font-size="11" font-family="sans-serif">Replied: ${answeredDate}</text>`;
      
      const lineEndY = contentY + 4;
      
      // Draw vertical border and append reply text elements
      svgElements += `
        <line x1="${cardX + 32}" y1="${lineStartY}" x2="${cardX + 32}" y2="${lineEndY}" stroke="${themeColor}" stroke-width="3.5" stroke-linecap="round" />
        ${replyTextElements}
      `;
    } else {
      contentY += 12; // Add spacing to hasnt answered block
      const lineStartY = contentY - 12;
      const lineEndY = contentY + 12;
      svgElements += `
        <line x1="${cardX + 32}" y1="${lineStartY}" x2="${cardX + 32}" y2="${lineEndY}" stroke="#8A8480" stroke-width="3.5" stroke-dasharray="4 4" />
        <text x="${cardX + 46}" y="${contentY + 4}" fill="#8A8480" font-size="13" font-weight="500" font-style="italic" font-family="sans-serif">Awaiting reply...</text>
      `;
    }

    // SVG Template
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="600" height="400">
        <!-- Background -->
        <rect width="600" height="400" fill="#FDFBF7" />

        <!-- Card Shadow -->
        <rect x="${cardX + 8}" y="${cardY + 8}" width="${cardWidth}" height="${cardHeight}" rx="24" fill="#2C221E" />

        <!-- Card Container with clip path to preserve rounded corners -->
        <g>
          <clipPath id="card-clip">
            <rect x="${cardX}" y="${cardY}" width="${cardWidth}" height="${cardHeight}" rx="24" />
          </clipPath>
          
          <!-- Outer border -->
          <rect x="${cardX}" y="${cardY}" width="${cardWidth}" height="${cardHeight}" rx="24" fill="#FFFFFF" stroke="#2C221E" stroke-width="3" />
          
          <g clip-path="url(#card-clip)">
            <!-- Titlebar -->
            <rect x="${cardX}" y="${cardY}" width="${cardWidth}" height="${titlebarHeight}" fill="${themeColor}" />
            <line x1="${cardX}" y1="${cardY + titlebarHeight}" x2="${cardX + cardWidth}" y2="${cardY + titlebarHeight}" stroke="#2C221E" stroke-width="3" />
            <text x="${cardX + 24}" y="${cardY + 34}" fill="#2C221E" font-size="18" font-weight="bold" font-family="sans-serif">${note.is_answered === 1 && note.reply_text ? `Answered Note #${note.letter_number}` : `Note #${note.letter_number}`}</text>
            
            <!-- Dynamic Content elements -->
            ${svgElements}
          </g>
        </g>
      </svg>
    `.trim();

    return new Response(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600, must-revalidate',
      },
    });
  } catch (error: any) {
    console.error('SVG Image generation error:', error);
    return new Response('Error generating image', { status: 500 });
  }
}

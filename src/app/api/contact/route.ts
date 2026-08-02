import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/mail';
import { checkRateLimit } from '@/lib/rate-limit';

export const runtime = 'edge';

interface ContactError {
  message?: string;
}

export async function POST(request: Request) {
  try {
    const rateLimit = await checkRateLimit(request, 'contact-send', 3, 60 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many contact requests. Please try again later.' },
        { status: 429 }
      );
    }
    const { category, message } = await request.json();

    if (!category || !message) {
      return NextResponse.json(
        { error: 'Category and message are required' },
        { status: 400 }
      );
    }

    if (message.trim().length > 1000) {
      return NextResponse.json(
        { error: 'Message cannot exceed 1000 characters' },
        { status: 400 }
      );
    }

    await sendEmail({
      to: 'haneumew@gmail.com',
      subject: `[Mimi Mail] New Contact Submission - ${category.toUpperCase()}`,
      text: `Category: ${category}\n\nMessage:\n${message}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #555; border-bottom: 2px solid #EBE7E4; padding-bottom: 10px;">New Mimi Mail Contact Submission</h2>
          <p><strong>Category:</strong> ${category}</p>
          <p><strong>Message:</strong></p>
          <div style="background-color: #F7F3EE; padding: 15px; border-left: 4px solid #8A8480; font-size: 14px; white-space: pre-wrap;">${message}</div>
        </div>
      `
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const contactError = error as ContactError;
    console.error('Contact API error:', error);
    return NextResponse.json(
      { error: contactError.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

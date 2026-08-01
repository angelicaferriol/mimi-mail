import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

interface ContactError {
  message?: string;
}

export async function POST(request: Request) {
  try {
    const { category, message } = await request.json();

    if (!category || !message) {
      return NextResponse.json(
        { error: 'Category and message are required' },
        { status: 400 }
      );
    }

    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    // Check if configuration exists
    const hasConfig = emailUser && emailPass && emailPass !== 'your-google-app-password-here';

    if (hasConfig) {
      // Create Nodemailer Transporter pointing to Gmail
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: emailUser,
          pass: emailPass,
        },
      });

      // Send actual email targeting haneumew@gmail.com
      await transporter.sendMail({
        from: emailUser,
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

      console.log(`[EMAIL SENT] Contact message forwarded to haneumew@gmail.com via Nodemailer.`);
    } else {
      // Fall back to terminal logging and print configuration warning
      console.log('\n======================================');
      console.log('[CONTACT SUBMITTED - MOCK MODE]');
      console.log('Recipient: haneumew@gmail.com');
      console.log(`Category: ${category}`);
      console.log(`Message:\n${message}`);
      console.log('\n[NOTICE] To send actual emails, please define EMAIL_USER and EMAIL_PASS in your .env.local file.');
      console.log('======================================\n');
    }

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

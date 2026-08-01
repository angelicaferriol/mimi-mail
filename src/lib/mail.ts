import nodemailer from 'nodemailer';

interface SendMailParams {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export async function sendEmail({ to, subject, text, html }: SendMailParams) {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  const hasConfig = emailUser && emailPass && emailPass !== 'your-google-app-password-here';

  if (hasConfig) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: emailUser,
          pass: emailPass,
        },
      });

      await transporter.sendMail({
        from: emailUser,
        to,
        subject,
        text,
        html,
      });
      console.log(`[EMAIL SENT] Sent mail successfully to: ${to}`);
    } catch (err) {
      console.error(`[EMAIL ERROR] Failed to send email to ${to}:`, err);
      mockLog(to, subject);
    }
  } else {
    mockLog(to, subject);
  }
}

function mockLog(to: string, subject: string) {
  console.log('\n======================================');
  console.log('[EMAIL MOCK MODE]');
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log('======================================\n');
}

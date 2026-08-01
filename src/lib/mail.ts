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
    const req = typeof require !== 'undefined' ? require : undefined;
    if (!req) {
      console.warn('[EMAIL WARNING] Nodemailer SMTP is not supported in the Cloudflare Edge runtime. Falling back to mock logging.');
      mockLog(to, subject, text);
      return;
    }
    
    try {
      const pkgMail = ['node', 'mailer'].join('');
      const nodemailer = req(pkgMail);
      
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
      mockLog(to, subject, text);
    }
  } else {
    mockLog(to, subject, text);
  }
}

function mockLog(to: string, subject: string, text: string) {
  console.log('\n======================================');
  console.log('[EMAIL MOCK MODE]');
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Body: ${text}`);
  console.log('======================================\n');
}

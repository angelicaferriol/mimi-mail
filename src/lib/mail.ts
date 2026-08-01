import { getRequestContext } from '@cloudflare/next-on-pages';

interface SendMailParams {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export async function sendEmail({ to, subject, text, html }: SendMailParams) {
  let env: any = {};
  let isProduction = false;
  try {
    const context = getRequestContext();
    if (context?.env) {
      env = context.env;
      isProduction = true;
    }
  } catch {
    // Local Node.js environment
  }

  const emailUser = env.EMAIL_USER || process.env.EMAIL_USER;
  const emailPass = env.EMAIL_PASS || process.env.EMAIL_PASS;
  const hasConfig = emailUser && emailPass && emailPass !== 'your-google-app-password-here';

  if (hasConfig) {
    if (isProduction) {
      try {
        console.log(`[EMAIL] Connecting to Gmail SMTP via worker-mailer...`);
        const { WorkerMailer } = await import('worker-mailer');
        const mailer = await WorkerMailer.connect({
          credentials: {
            username: emailUser,
            password: emailPass,
          },
          authType: 'login',
          host: 'smtp.gmail.com',
          port: 465,
          secure: true,
        });

        await mailer.send({
          from: { name: 'Mimi Mail', email: emailUser },
          to: { email: to },
          subject: subject,
          text: text,
          html: html,
        });
        console.log(`[EMAIL SENT] Sent mail successfully via worker-mailer to: ${to}`);
        return;
      } catch (err) {
        console.error(`[EMAIL ERROR] Failed to send email via worker-mailer to ${to}:`, err);
      }
    } else {
      const req = typeof require !== 'undefined' ? require : undefined;
      if (req) {
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
          console.log(`[EMAIL SENT] Sent SMTP mail successfully to: ${to}`);
          return;
        } catch (err) {
          console.error(`[EMAIL ERROR] Failed to send local SMTP email:`, err);
        }
      }
    }
  }

  // Fallback to mockLog
  mockLog(to, subject, text);
}

function mockLog(to: string, subject: string, text: string) {
  console.log('\n======================================');
  console.log('[EMAIL MOCK MODE]');
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Body: ${text}`);
  console.log('======================================\n');
}

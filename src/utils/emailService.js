const nodemailer = require('nodemailer');

const createTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    return null; // SMTP unconfigured, use development mock logger
  }

  return nodemailer.createTransport({
    host,
    port: Number(port),
    secure: Number(port) === 465,
    auth: { user, pass },
  });
};

/**
 * Send access credentials & onboarding email to newly enrolled student
 */
const sendWelcomeEmail = async ({
  toEmail,
  customerName,
  temporaryPassword,
  category,
  orderId,
  amountPaid,
}) => {
  const loginUrl = `${process.env.FRONTEND_BASE_URL || 'http://localhost:5173'}/login`;
  const fromAddress = process.env.EMAIL_FROM || '"Universal Mock Test" <no-reply@universalmock.com>';

  const subject = `You're in! Your Universal Mock Test access is ready 🎉`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; color: #1e293b; }
    .container { max-width: 580px; margin: 30px auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%); padding: 36px 30px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0 0 8px 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
    .header p { margin: 0; font-size: 14px; opacity: 0.9; }
    .content { padding: 32px 30px; }
    .credential-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 14px; padding: 20px; margin: 24px 0; text-align: left; }
    .credential-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 13px; }
    .credential-label { color: #64748b; font-weight: 600; }
    .credential-val { color: #0f172a; font-weight: 700; font-family: monospace; font-size: 14px; }
    .btn { display: inline-block; width: 100%; box-sizing: border-box; text-align: center; background: #4f46e5; color: #ffffff !important; padding: 14px 24px; border-radius: 12px; font-weight: 700; font-size: 14px; text-decoration: none; margin: 20px 0 10px 0; }
    .steps-box { background: #f8fafc; border-radius: 12px; padding: 18px; margin-top: 24px; }
    .step-item { font-size: 12px; margin-bottom: 8px; color: #475569; }
    .footer { padding: 20px 30px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Universal Mock Test</h1>
      <p>Enrollment Confirmed • Examination All-Access Pass</p>
    </div>
    
    <div class="content">
      <p style="font-size: 15px; margin-top: 0;">Hi <strong>${customerName}</strong>,</p>
      <p style="font-size: 13px; line-height: 1.6; color: #475569;">
        Welcome to Universal Mock Test! Your payment of <strong>₹${amountPaid}</strong> for the <strong>${category}</strong> stream has been received and verified.
      </p>

      <div class="credential-box">
        <div style="font-size: 11px; font-weight: 800; color: #166534; text-transform: uppercase; margin-bottom: 12px; letter-spacing: 0.5px;">
          🔑 Your Account Login Credentials
        </div>
        <div class="credential-row">
          <span class="credential-label">Registered Email:</span>
          <span class="credential-val">${toEmail}</span>
        </div>
        <div class="credential-row" style="margin-bottom: 0;">
          <span class="credential-label">Temporary Password:</span>
          <span class="credential-val" style="color: #4f46e5; font-size: 15px;">${temporaryPassword}</span>
        </div>
      </div>

      <a href="${loginUrl}" class="btn" target="_blank">
        Launch Student Portal & Log In &rarr;
      </a>
      <p style="font-size: 11px; text-align: center; color: #64748b; margin: 0 0 20px 0;">
        (Tip: You will be prompted to set a new password on your first login)
      </p>

      <div class="steps-box">
        <div style="font-size: 12px; font-weight: 700; color: #0f172a; margin-bottom: 10px;">
          ⚡ Quick Start Guide:
        </div>
        <div class="step-item">1. Click the button above to access the candidate portal.</div>
        <div class="step-item">2. Enter your email and temporary password to sign in.</div>
        <div class="step-item">3. Select your <strong>${category}</strong> stream to launch mock tests and practice drills.</div>
      </div>

      <div style="margin-top: 24px; font-size: 11px; color: #94a3b8;">
        Order Reference: <code>${orderId}</code>
      </div>
    </div>

    <div class="footer">
      Universal Mock Test Inc. • Support: support@universalmock.com<br>
      Automated account security dispatch. Please do not reply directly to this email.
    </div>
  </div>
</body>
</html>
  `;

  const transporter = createTransporter();

  if (!transporter) {
    console.log(`\n======================================================`);
    console.log(`📧 [MOCK EMAIL DISPATCH] To: ${toEmail}`);
    console.log(`📌 Subject: ${subject}`);
    console.log(`👤 Customer: ${customerName} | Stream: ${category}`);
    console.log(`🔑 Credentials: Email: ${toEmail} | Password: ${temporaryPassword}`);
    console.log(`🌐 Login URL: ${loginUrl}`);
    console.log(`======================================================\n`);
    return { success: true, simulated: true };
  }

  try {
    const info = await transporter.sendMail({
      from: fromAddress,
      to: toEmail,
      subject,
      html: htmlContent,
    });
    console.log('[EmailService] Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('[EmailService Error]', err);
    // Return gracefully so payment completion is not blocked
    return { success: false, error: err.message };
  }
};

module.exports = {
  sendWelcomeEmail,
};

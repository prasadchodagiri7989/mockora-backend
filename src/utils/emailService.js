const nodemailer = require('nodemailer');

/**
 * Configure Nodemailer SMTP Transporter
 * Supports standard SMTP (Gmail, Outlook, custom SMTP server, AWS SES, SendGrid, etc.)
 */
const createTransporter = () => {
  try {
    require('dotenv').config();
  } catch (e) {}

  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  if (!user || !pass) {
    console.warn('[SMTP Notice] SMTP_USER or SMTP_PASS not set in environment.');
    return null; // SMTP unconfigured, fallback to rich console preview
  }

  const transportOptions = {
    host,
    port,
    secure,
    auth: { user, pass },
    tls: {
      rejectUnauthorized: false, // Prevents certificate errors in local/staging environments
    },
  };

  if (process.env.SMTP_SERVICE) {
    transportOptions.service = process.env.SMTP_SERVICE;
  }

  return nodemailer.createTransport(transportOptions);
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
  transactionId,
  amountPaid,
  paymentDate = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
}) => {
  const loginUrl = `${(process.env.FRONTEND_BASE_URL || 'http://localhost:5173').replace(/\/$/, '')}/login`;
  const fromAddress = process.env.EMAIL_FROM || '"MockOra Support" <neuvexa.services@gmail.com>';
  const displayTxnId = transactionId || orderId || 'TXN_' + Date.now();
  const subject = `Your MockOra Candidate Login Credentials 🔑`;

  const textContent = `
MockOra - Universal Mock Test Platform
Developed by NeuVexa.in

Dear ${customerName || 'Candidate'},

Thank you for enrolling in MockOra! Your payment of ₹${amountPaid || 999} for ${category || 'All-Exam Pass'} has been verified.
Order Reference: ${orderId}
Transaction ID: ${displayTxnId}

Here are your candidate login credentials:
Login Portal: ${loginUrl}
Registered Email: ${toEmail}
Temporary Password: ${temporaryPassword || '(Your existing password remains active)'}

Click the link below or paste it in your browser to start taking full-length timed tests:
${loginUrl}

If you have any questions or need support, contact neuvexa.services@gmail.com or DM us on Instagram @neuvexa.in.

© ${new Date().getFullYear()} MockOra • Developed by NeuVexa.in
`;

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; margin: 0; padding: 20px; color: #f8fafc; }
    .container { max-width: 580px; margin: 0 auto; background: #1e293b; border-radius: 16px; border: 1px solid #334155; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
    .header { background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 32px 24px; text-align: center; color: #ffffff; }
    .content { padding: 28px 24px; }
    .badge { display: inline-block; background: #10b981; color: #ffffff; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 99px; text-transform: uppercase; margin-bottom: 12px; }
    .cred-box { background: #0f172a; border: 1px solid #334155; border-radius: 12px; padding: 20px; margin: 20px 0; }
    .cred-row { display: flex; justify-content: space-between; padding: 9px 0; border-bottom: 1px solid #1e293b; font-size: 13px; }
    .cred-row:last-child { border-bottom: none; }
    .cred-label { color: #94a3b8; }
    .cred-val { color: #f8fafc; font-weight: bold; font-family: monospace; }
    .pass-val { font-size: 18px; color: #34d399; letter-spacing: 0.5px; }
    .btn { display: block; text-align: center; background: #2563eb; color: #ffffff !important; text-decoration: none; padding: 15px 24px; border-radius: 10px; font-weight: 800; font-size: 14px; margin: 24px 0; }
    .steps-box { background: #0f172a; border-radius: 10px; border: 1px solid #334155; padding: 16px; margin-top: 20px; font-size: 12px; color: #cbd5e1; }
    .footer { padding: 20px 24px; background: #0f172a; border-top: 1px solid #334155; font-size: 11px; color: #64748b; text-align: center; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin:0;font-size:24px;font-weight:900;letter-spacing:-0.5px;">MockOra Platform</h2>
      <p style="margin:6px 0 0;font-size:13px;opacity:0.9;">Your Candidate Account Credentials</p>
    </div>
    <div class="content">
      <div style="text-align: center;">
        <span class="badge">Payment Confirmed • All-Exam Pass Active</span>
      </div>
      <p style="font-size:15px;margin:16px 0 10px;">Hello <strong>${customerName || 'Candidate'}</strong>,</p>
      <p style="color:#cbd5e1;line-height:1.6;margin:0 0 16px;font-size:14px;">
        Congratulations! Your enrollment for <strong>${category || 'dMAT General Academic'}</strong> has been verified. Here are your official candidate portal login credentials:
      </p>

      <div class="cred-box">
        <div class="cred-row">
          <span class="cred-label">Login Portal:</span>
          <span class="cred-val" style="color:#60a5fa;">${loginUrl}</span>
        </div>
        <div class="cred-row">
          <span class="cred-label">Order Reference:</span>
          <span class="cred-val" style="color:#a78bfa;">${orderId}</span>
        </div>
        <div class="cred-row">
          <span class="cred-label">Registered Email:</span>
          <span class="cred-val">${toEmail}</span>
        </div>
        <div class="cred-row">
          <span class="cred-label">Temporary Password:</span>
          <span class="cred-val pass-val">${temporaryPassword || '(Your existing password remains active)'}</span>
        </div>
      </div>

      <a href="${loginUrl}" class="btn">Launch Candidate Portal & Log In &rarr;</a>

      <div class="steps-box">
        <div style="font-weight:bold;color:#f8fafc;margin-bottom:6px;">🚀 Quick Start:</div>
        <div>1. Click the button above to log in with your email and password.</div>
        <div>2. Select your exam stream to begin full-length timed mock tests.</div>
        <div>3. Receive instant AI concept diagnostic reports upon submission.</div>
      </div>

      <p style="font-size:12px;color:#94a3b8;line-height:1.5;margin-top:20px;">
        💡 <em>Tip:</em> You can update your password anytime in Account Settings. If you need assistance, reply directly to this email or reach us on Instagram <a href="https://instagram.com/neuvexa.in" style="color:#60a5fa;">@neuvexa.in</a>.
      </p>
    </div>
    <div class="footer">
      © ${new Date().getFullYear()} MockOra • Developed by NeuVexa.in<br/>
      Need support? Contact <a href="mailto:neuvexa.services@gmail.com" style="color:#94a3b8;">neuvexa.services@gmail.com</a>
    </div>
  </div>
</body>
</html>
  `;

  const transporter = createTransporter();

  if (!transporter) {
    console.log(`\n======================================================`);
    console.log(`📧 [NODEMAILER PREVIEW (SMTP Credentials Not Set)]`);
    console.log(`📬 To: ${toEmail}`);
    console.log(`📌 Subject: ${subject}`);
    console.log(`🔑 Credentials: Email: ${toEmail} | Pass: ${temporaryPassword}`);
    console.log(`🌐 Login URL: ${loginUrl}`);
    console.log(`======================================================\n`);
    return { success: true, simulated: true, transactionId: displayTxnId };
  }

  try {
    const info = await transporter.sendMail({
      from: fromAddress,
      to: toEmail,
      subject,
      text: textContent,
      html: htmlContent,
      priority: 'high',
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'high',
      },
    });
    console.log('[Nodemailer] Welcome credentials email dispatched successfully. Message ID:', info.messageId);
    return { success: true, messageId: info.messageId, transactionId: displayTxnId };
  } catch (err) {
    console.error('[Nodemailer Welcome Email Send Error]', err);
    return { success: false, error: err.message };
  }
};

/**
 * Send admin reply to visitor chat message
 */
const sendChatReplyEmail = async ({ toEmail, recipientName, originalMessage, replyText }) => {
  const fromAddress = process.env.EMAIL_FROM || '"MockOra Support" <support@mockora.com>';
  const subject = 'Reply to your inquiry on MockOra';
  const transporter = createTransporter();

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; }
    .header { background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 28px; text-align: center; color: #ffffff; }
    .content { padding: 28px; }
    .quote-box { background: #f1f5f9; border-left: 4px solid #4f46e5; padding: 14px 18px; border-radius: 8px; margin: 18px 0; font-size: 13px; color: #475569; }
    .reply-box { background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 12px; padding: 18px; margin: 20px 0; font-size: 14px; color: #1e1b4b; line-height: 1.6; }
    .footer { padding: 20px 28px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin:0;font-size:22px;font-weight:800;">MockOra Support</h2>
      <p style="margin:6px 0 0;font-size:13px;opacity:0.9;">Response to your inquiry</p>
    </div>
    <div class="content">
      <p>Hi <strong>${recipientName || 'there'}</strong>,</p>
      <p>Thank you for contacting MockOra. Here is our response:</p>
      
      <div class="reply-box">
        ${(replyText || '').replace(/\n/g, '<br/>')}
      </div>

      <p style="font-size:12px;color:#64748b;margin-bottom:6px;">Your original inquiry:</p>
      <div class="quote-box">
        "${originalMessage || ''}"
      </div>

      <p style="font-size:13px;color:#475569;margin-top:24px;">
        If you have any further questions, feel free to reply directly to this email or reach us on Instagram <a href="https://instagram.com/neuvexa.in" style="color:#4f46e5;font-weight:bold;">@neuvexa.in</a>.
      </p>
    </div>
    <div class="footer">
      © ${new Date().getFullYear()} MockOra • Developed by NeuVexa.in
    </div>
  </div>
</body>
</html>
  `;

  if (!transporter) {
    console.log(`\n📧 [Simulated Email] Reply dispatched to: ${toEmail}`);
    console.log(`Reply content: ${replyText}`);
    return { success: true, simulated: true };
  }

  try {
    const info = await transporter.sendMail({
      from: fromAddress,
      to: toEmail,
      subject,
      html: htmlContent,
    });
    console.log('[Nodemailer] Reply email dispatched successfully. Message ID:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('[Nodemailer Reply Error]', err);
    return { success: false, error: err.message };
  }
};

/**
 * Send password change notice by Admin
 */
const sendPasswordResetNoticeEmail = async ({ toEmail, customerName, newPassword }) => {
  const fromAddress = process.env.EMAIL_FROM || '"MockOra Support" <neuvexa.services@gmail.com>';
  const subject = 'Your MockOra Account Password Has Been Updated 🔑';
  const transporter = createTransporter();
  const frontendBase = process.env.FRONTEND_BASE_URL || 'http://localhost:5173';
  const loginUrl = `${frontendBase.replace(/\/$/, '')}/login`;

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0f172a; margin: 0; padding: 24px; color: #f8fafc; }
    .container { max-width: 580px; margin: 0 auto; background: #1e293b; border-radius: 16px; border: 1px solid #334155; overflow: hidden; }
    .header { background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 28px; text-align: center; color: #ffffff; }
    .content { padding: 28px; }
    .cred-box { background: #0f172a; border: 1px solid #334155; border-radius: 12px; padding: 18px; margin: 20px 0; }
    .btn { display: block; text-align: center; background: #2563eb; color: #ffffff !important; text-decoration: none; padding: 14px 24px; border-radius: 10px; font-weight: 700; margin: 20px 0; }
    .footer { padding: 18px 28px; background: #0f172a; border-top: 1px solid #334155; font-size: 11px; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin:0;font-size:22px;font-weight:800;">MockOra Platform</h2>
      <p style="margin:6px 0 0;font-size:13px;opacity:0.9;">Account Password Update</p>
    </div>
    <div class="content">
      <p>Hello <strong>${customerName || 'Candidate'}</strong>,</p>
      <p style="color:#cbd5e1;line-height:1.5;">An administrator has updated your password for your MockOra account (<strong>${toEmail}</strong>).</p>
      <div class="cred-box">
        <div style="font-size:12px;color:#94a3b8;margin-bottom:6px;">Your New Password:</div>
        <div style="font-size:18px;font-weight:bold;font-family:monospace;color:#34d399;">${newPassword}</div>
      </div>
      <a href="${loginUrl}" class="btn">Log In to Candidate Portal &rarr;</a>
      <p style="font-size:12px;color:#94a3b8;line-height:1.5;">If you did not request this update, please contact support at <a href="mailto:neuvexa.services@gmail.com" style="color:#60a5fa;">neuvexa.services@gmail.com</a>.</p>
    </div>
    <div class="footer">
      © ${new Date().getFullYear()} MockOra • Developed by NeuVexa.in
    </div>
  </div>
</body>
</html>
  `;

  if (!transporter) {
    console.log(`[Simulated Email] Password reset notice for ${toEmail}: ${newPassword}`);
    return { success: true, simulated: true };
  }

  try {
    const info = await transporter.sendMail({
      from: fromAddress,
      to: toEmail,
      subject,
      html: htmlContent,
    });
    console.log('[Nodemailer] Password reset notice dispatched. Message ID:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('[Nodemailer Password Reset Error]', err);
    return { success: false, error: err.message };
  }
};

module.exports = {
  sendWelcomeEmail,
  sendChatReplyEmail,
  sendPasswordResetNoticeEmail,
};


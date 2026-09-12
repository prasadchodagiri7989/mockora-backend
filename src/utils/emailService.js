const nodemailer = require('nodemailer');

/**
 * Configure Nodemailer SMTP Transporter
 * Supports standard SMTP (Gmail, Outlook, custom SMTP server, AWS SES, SendGrid, etc.)
 */
const createTransporter = () => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  if (!user || !pass) {
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
  const loginUrl = `${process.env.FRONTEND_BASE_URL || 'http://localhost:5173'}/login`;
  const fromAddress = process.env.EMAIL_FROM || '"Universal Mock Test" <no-reply@universalmock.com>';
  const displayTxnId = transactionId || orderId || 'CF_TXN_' + Date.now();

  const subject = `Order Confirmed: Your Universal Mock Test Access is Ready 🎉`;

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
      color: #1e293b;
    }
    table {
      border-spacing: 0;
      border-collapse: collapse;
    }
    td {
      padding: 0;
    }
    img {
      border: 0;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #f1f5f9;
      padding: 30px 10px;
    }
    .main-card {
      background-color: #ffffff;
      margin: 0 auto;
      max-width: 600px;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.08);
      border: 1px solid #e2e8f0;
    }
    .header-banner {
      background: linear-gradient(135deg, #4338ca 0%, #3730a3 50%, #1e1b4b 100%);
      padding: 40px 35px;
      text-align: center;
      color: #ffffff;
    }
    .brand-badge {
      display: inline-block;
      background: rgba(255, 255, 255, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.25);
      padding: 5px 14px;
      border-radius: 30px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-bottom: 15px;
    }
    .header-title {
      margin: 0 0 8px 0;
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.5px;
      line-height: 1.2;
    }
    .header-subtitle {
      margin: 0;
      font-size: 14px;
      opacity: 0.9;
      font-weight: 400;
    }
    .content-area {
      padding: 35px 35px 25px 35px;
    }
    .greeting {
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 12px 0;
    }
    .lead-text {
      font-size: 14px;
      line-height: 1.6;
      color: #475569;
      margin: 0 0 24px 0;
    }
    .receipt-box {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 18px 20px;
      margin-bottom: 24px;
    }
    .receipt-row {
      display: flex;
      justify-content: space-between;
      padding: 7px 0;
      font-size: 13px;
      border-bottom: 1px dashed #e2e8f0;
    }
    .receipt-row:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
    .receipt-label {
      color: #64748b;
      font-weight: 500;
    }
    .receipt-val {
      color: #0f172a;
      font-weight: 700;
      text-align: right;
    }
    .credentials-card {
      background: linear-gradient(180deg, #f0fdf4 0%, #ecfdf5 100%);
      border: 1.5px solid #86efac;
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 28px;
    }
    .credentials-title {
      font-size: 12px;
      font-weight: 800;
      color: #166534;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
    }
    .cred-item {
      background: #ffffff;
      border: 1px solid #bbf7d0;
      border-radius: 10px;
      padding: 10px 14px;
      margin-bottom: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .cred-item:last-child {
      margin-bottom: 0;
    }
    .cred-key {
      font-size: 12px;
      font-weight: 600;
      color: #475569;
    }
    .cred-value {
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
      font-size: 14px;
      font-weight: 800;
      color: #4338ca;
      letter-spacing: 0.5px;
    }
    .btn-container {
      text-align: center;
      margin: 28px 0 20px 0;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
      color: #ffffff !important;
      font-size: 15px;
      font-weight: 800;
      text-decoration: none;
      padding: 16px 36px;
      border-radius: 14px;
      box-shadow: 0 4px 15px rgba(79, 70, 229, 0.35);
      letter-spacing: -0.2px;
    }
    .security-note {
      font-size: 11px;
      text-align: center;
      color: #94a3b8;
      margin-bottom: 25px;
    }
    .steps-section {
      background-color: #f8fafc;
      border-radius: 14px;
      padding: 20px;
      margin-bottom: 20px;
    }
    .steps-title {
      font-size: 13px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 12px;
    }
    .step-item {
      font-size: 12px;
      color: #475569;
      line-height: 1.6;
      margin-bottom: 8px;
    }
    .footer-area {
      background-color: #0f172a;
      padding: 28px 35px;
      text-align: center;
      color: #64748b;
      font-size: 11px;
      line-height: 1.6;
    }
    .footer-area a {
      color: #818cf8;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <table class="main-card" width="100%" cellpadding="0" cellspacing="0">
      <!-- 1. Header Banner -->
      <tr>
        <td class="header-banner">
          <div class="brand-badge">Official Candidate Pass</div>
          <h1 class="header-title">Universal Mock Test</h1>
          <p class="header-subtitle">Enrollment Confirmed • Examination Simulator Access Ready</p>
        </td>
      </tr>

      <!-- 2. Main Content Area -->
      <tr>
        <td class="content-area">
          <p class="greeting">Dear ${customerName},</p>
          <p class="lead-text">
            Congratulations! Your payment has been successfully processed. Your <strong>Universal Mock Test All-Exam Pass</strong> is now active, granting you full access to timed simulators, AI weakness reviews, and sectional drills.
          </p>

          <!-- Transaction & Order Receipt -->
          <div class="receipt-box">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding: 6px 0; font-size: 12px; color: #64748b;">Candidate Name:</td>
                <td style="padding: 6px 0; font-size: 13px; font-weight: 700; color: #0f172a; text-align: right;">${customerName}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-size: 12px; color: #64748b; border-top: 1px dashed #e2e8f0;">Target Stream:</td>
                <td style="padding: 6px 0; font-size: 13px; font-weight: 700; color: #4338ca; text-align: right; border-top: 1px dashed #e2e8f0;">${category}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-size: 12px; color: #64748b; border-top: 1px dashed #e2e8f0;">Transaction ID:</td>
                <td style="padding: 6px 0; font-size: 12px; font-weight: 700; font-family: monospace; color: #0f172a; text-align: right; border-top: 1px dashed #e2e8f0;">${displayTxnId}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-size: 12px; color: #64748b; border-top: 1px dashed #e2e8f0;">Order Reference:</td>
                <td style="padding: 6px 0; font-size: 12px; font-weight: 700; font-family: monospace; color: #0f172a; text-align: right; border-top: 1px dashed #e2e8f0;">${orderId}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-size: 12px; color: #64748b; border-top: 1px dashed #e2e8f0;">Amount Paid:</td>
                <td style="padding: 6px 0; font-size: 14px; font-weight: 800; color: #166534; text-align: right; border-top: 1px dashed #e2e8f0;">₹${amountPaid} (Inclusive of GST)</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-size: 12px; color: #64748b; border-top: 1px dashed #e2e8f0;">Date of Payment:</td>
                <td style="padding: 6px 0; font-size: 12px; font-weight: 600; color: #475569; text-align: right; border-top: 1px dashed #e2e8f0;">${paymentDate}</td>
              </tr>
            </table>
          </div>

          <!-- Credentials Box -->
          <div class="credentials-card">
            <div class="credentials-title">
              🔒 Your Secure Login Credentials
            </div>
            
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background: #ffffff; border: 1px solid #bbf7d0; border-radius: 10px; padding: 12px 14px; margin-bottom: 8px;">
                  <span style="display: block; font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase;">Login Email:</span>
                  <span style="font-size: 14px; font-weight: 700; color: #0f172a;">${toEmail}</span>
                </td>
              </tr>
              <tr><td style="height: 8px;"></td></tr>
              <tr>
                <td style="background: #ffffff; border: 1px solid #bbf7d0; border-radius: 10px; padding: 12px 14px;">
                  <span style="display: block; font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase;">Temporary Password:</span>
                  <span style="font-family: monospace; font-size: 16px; font-weight: 800; color: #4338ca; letter-spacing: 0.5px;">${temporaryPassword}</span>
                </td>
              </tr>
            </table>
          </div>

          <!-- CTA Button -->
          <div class="btn-container">
            <a href="${loginUrl}" class="cta-button" target="_blank">
              Launch Candidate Portal &rarr;
            </a>
          </div>
          <p class="security-note">
            (For your security, you will be prompted to update your password upon first login)
          </p>

          <!-- 3. Next Steps -->
          <div class="steps-section">
            <div class="steps-title">🚀 How to Get Started:</div>
            <div class="step-item"><strong>1. Log In:</strong> Click the button above and enter your registered email and temporary password.</div>
            <div class="step-item"><strong>2. Choose Exam:</strong> Navigate to your <strong>${category}</strong> stream to launch full mock exams or sectional tests.</div>
            <div class="step-item"><strong>3. Review Diagnostics:</strong> After submission, inspect your instant AI review report with concept accuracy and time analytics.</div>
          </div>
        </td>
      </tr>

      <!-- 4. Footer Area -->
      <tr>
        <td class="footer-area">
          <p style="margin: 0 0 6px 0; font-weight: 600; color: #94a3b8;">Universal Mock Test Technologies • A NeuVexa Product</p>
          <p style="margin: 0 0 10px 0;">Questions or technical support? Reach out at <a href="mailto:support@universalmock.com">support@universalmock.com</a></p>
          <p style="margin: 0; font-size: 10px; color: #475569;">
            This is an automated enrollment dispatch. Transaction ID: ${displayTxnId}. All rights reserved © ${new Date().getFullYear()}.
          </p>
        </td>
      </tr>
    </table>
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
    console.log(`👤 Customer: ${customerName} | Category: ${category}`);
    console.log(`💳 Transaction ID: ${displayTxnId}`);
    console.log(`🔑 Credentials: Email: ${toEmail} | Pass: ${temporaryPassword}`);
    console.log(`🌐 Login URL: ${loginUrl}`);
    console.log(`ℹ️ To send live emails, configure SMTP_USER & SMTP_PASS in backend/.env`);
    console.log(`======================================================\n`);
    return { success: true, simulated: true, transactionId: displayTxnId };
  }

  try {
    const info = await transporter.sendMail({
      from: fromAddress,
      to: toEmail,
      subject,
      html: htmlContent,
    });
    console.log('[Nodemailer] Welcome email dispatched successfully. Message ID:', info.messageId);
    return { success: true, messageId: info.messageId, transactionId: displayTxnId };
  } catch (err) {
    console.error('[Nodemailer Send Error]', err);
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

module.exports = {
  sendWelcomeEmail,
  sendChatReplyEmail,
};


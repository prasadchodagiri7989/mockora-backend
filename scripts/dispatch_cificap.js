require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

async function main() {
  const email = 'prasad.cificap@gmail.com';
  const newPassword = 'Mock@Prasad2026';
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  const uris = [
    'mongodb://127.0.0.1:27017/universal_mock_test',
    'mongodb+srv://chodagiriprasad5:Prasad%40123@cluster0.w4dod.mongodb.net/mockora-backend?retryWrites=true&w=majority&appName=Cluster0'
  ];

  for (const uri of uris) {
    try {
      const conn = await mongoose.createConnection(uri).asPromise();
      await conn.db.collection('users').updateOne(
        { email },
        { $set: { password: hashedPassword, passwordTemporary: true, updatedAt: new Date() } }
      );
      // Also save temporaryPassword on order so frontend can display it
      await conn.db.collection('orders').updateOne(
        { cashfreeOrderId: 'ORD_1789254081206_2391' },
        { $set: { temporaryPassword: newPassword, credentialsSent: true, updatedAt: new Date() } }
      );
      await conn.close();
    } catch (e) {
      console.error(e.message);
    }
  }

  // Dispatch email with clean high-deliverability format
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: { rejectUnauthorized: false }
  });

  const loginUrl = `${(process.env.FRONTEND_BASE_URL || 'http://localhost:5173').replace(/\/$/, '')}/login`;

  const textContent = `
MockOra - Universal Mock Test Platform
Developed by NeuVexa.in

Dear Ch N V S S Durga Prasad,

Your 1-Year All-Access Pass for dMAT General Academic is active!
Order Reference: ORD_1789254081206_2391

Here are your login credentials:
Login Portal: ${loginUrl}
Registered Email: ${email}
Temporary Password: ${newPassword}

Launch the student portal and sign in to start your full-length timed tests.
Need help? Contact neuvexa.services@gmail.com
`;

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0f172a; margin: 0; padding: 24px; color: #f8fafc; }
    .container { max-width: 580px; margin: 0 auto; background: #1e293b; border-radius: 16px; border: 1px solid #334155; overflow: hidden; }
    .header { background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 32px 24px; text-align: center; color: #ffffff; }
    .content { padding: 28px 24px; }
    .badge { display: inline-block; background: #10b981; color: #fff; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 99px; text-transform: uppercase; margin-bottom: 12px; }
    .cred-box { background: #0f172a; border: 1px solid #334155; border-radius: 12px; padding: 20px; margin: 20px 0; }
    .cred-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #1e293b; font-size: 13px; }
    .cred-row:last-child { border-bottom: none; }
    .cred-label { color: #94a3b8; }
    .cred-val { color: #f8fafc; font-weight: bold; font-family: monospace; }
    .pass-val { font-size: 18px; color: #34d399; letter-spacing: 0.5px; }
    .btn { display: block; text-align: center; background: #2563eb; color: #ffffff !important; text-decoration: none; padding: 14px 24px; border-radius: 10px; font-weight: 800; font-size: 14px; margin: 24px 0; }
    .footer { padding: 20px 24px; background: #0f172a; border-top: 1px solid #334155; font-size: 11px; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin:0;font-size:24px;font-weight:900;">MockOra Platform</h2>
      <p style="margin:6px 0 0;font-size:13px;opacity:0.9;">Your Candidate Account Credentials</p>
    </div>
    <div class="content">
      <div style="text-align: center;">
        <span class="badge">Payment Confirmed • All-Exam Pass Active</span>
      </div>
      <p>Hello <strong>Ch N V S S Durga Prasad</strong>,</p>
      <p style="color:#cbd5e1;line-height:1.5;">
        Thank you for enrolling in MockOra. Your payment of <strong>₹999</strong> for <strong>dMAT General Academic</strong> (Order: <strong>ORD_1789254081206_2391</strong>) was verified successfully.
      </p>

      <div class="cred-box">
        <div class="cred-row">
          <span class="cred-label">Login Portal:</span>
          <span class="cred-val" style="color:#60a5fa;">${loginUrl}</span>
        </div>
        <div class="cred-row">
          <span class="cred-label">Registered Email:</span>
          <span class="cred-val">${email}</span>
        </div>
        <div class="cred-row">
          <span class="cred-label">Temporary Password:</span>
          <span class="cred-val pass-val">${newPassword}</span>
        </div>
      </div>

      <a href="${loginUrl}" class="btn">Log In to Candidate Portal &rarr;</a>

      <p style="font-size:12px;color:#94a3b8;line-height:1.5;">
        💡 You can change your password anytime after logging in. If you need any assistance, reply directly to this email or contact us on Instagram <a href="https://instagram.com/neuvexa.in" style="color:#60a5fa;">@neuvexa.in</a>.
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

  console.log('Dispatching email to:', email);
  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || '"MockOra Support" <neuvexa.services@gmail.com>',
    to: email,
    subject: 'Your MockOra Candidate Login Credentials 🔑',
    text: textContent,
    html: htmlContent,
    priority: 'high',
    headers: {
      'X-Priority': '1',
      'X-MSMail-Priority': 'High',
      'Importance': 'high',
    },
  });

  console.log('✅ Email dispatched! MessageId:', info.messageId, 'Response:', info.response);
}

main().catch(console.error);

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

async function sendCredentials() {
  const email = 'prasadpk1433@gmail.com';
  const newTempPassword = 'Mock@Prasad' + Math.floor(1000 + Math.random() * 9000);
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newTempPassword, salt);

  const uris = [
    'mongodb+srv://chodagiriprasad5:Prasad%40123@cluster0.w4dod.mongodb.net/mockora-backend?retryWrites=true&w=majority&appName=Cluster0',
    'mongodb://127.0.0.1:27017/universal_mock_test'
  ];

  for (const uri of uris) {
    try {
      const conn = await mongoose.createConnection(uri).asPromise();
      const User = conn.db.collection('users');
      const res = await User.updateOne(
        { email },
        { 
          $set: { 
            password: hashedPassword, 
            passwordTemporary: true,
            status: 'active',
            updatedAt: new Date()
          } 
        }
      );
      console.log(`Updated user password in ${uri.includes('cluster0') ? 'Atlas' : 'Local'}: modifiedCount=${res.modifiedCount}`);
      await conn.close();
    } catch (e) {
      console.error('DB update error for', uri, e.message);
    }
  }

  // Now send the welcome email using emailService logic
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  const frontendBase = process.env.FRONTEND_BASE_URL || 'http://localhost:5173';
  const loginUrl = `${frontendBase.replace(/\/$/, '')}/login`;

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to MockOra 🎉</title>
  <style>
    body { margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc; }
    .container { max-width: 600px; margin: 30px auto; background-color: #1e293b; border-radius: 20px; overflow: hidden; border: 1px solid #334155; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
    .header { background: linear-gradient(135deg, #1d4ed8, #2563eb, #3b82f6); padding: 40px 30px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -0.5px; }
    .header p { margin: 10px 0 0; font-size: 14px; opacity: 0.9; }
    .content { padding: 36px 30px; }
    .card { background-color: #0f172a; border-radius: 14px; border: 1px solid #334155; padding: 24px; margin: 24px 0; }
    .card-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #1e293b; font-size: 13px; }
    .card-row:last-child { border-bottom: none; }
    .card-label { color: #94a3b8; font-weight: 500; }
    .card-val { color: #f8fafc; font-weight: 700; font-family: monospace; font-size: 14px; }
    .badge { display: inline-block; background-color: #10b981; color: #ffffff; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 800; text-transform: uppercase; }
    .btn { display: block; text-align: center; background: linear-gradient(135deg, #2563eb, #1d4ed8); color: #ffffff !important; text-decoration: none; padding: 16px 28px; border-radius: 12px; font-weight: 800; font-size: 15px; margin: 28px 0; box-shadow: 0 10px 20px -5px rgba(37,99,235,0.4); }
    .footer { padding: 24px 30px; background-color: #0f172a; border-top: 1px solid #334155; text-align: center; font-size: 12px; color: #64748b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div style="font-size: 36px; margin-bottom: 8px;">🚀</div>
      <h1>Welcome to MockOra</h1>
      <p>Your 1-Year All-Access Pass is Active</p>
    </div>
    <div class="content">
      <p style="font-size: 16px; margin: 0 0 16px;">Hello <strong>Prasad</strong>,</p>
      <p style="font-size: 14px; color: #cbd5e1; line-height: 1.6; margin: 0 0 20px;">
        Thank you for enrolling in <strong>MockOra</strong>! Your payment of <strong>₹999</strong> was successfully confirmed. We have provisioned your candidate account and your login credentials are ready below.
      </p>

      <div class="card">
        <div style="margin-bottom: 14px;">
          <span class="badge">Payment Confirmed</span>
        </div>
        <div class="card-row">
          <span class="card-label">Order Reference:</span>
          <span class="card-val" style="color: #60a5fa;">ORD_1789252037185_8701</span>
        </div>
        <div class="card-row">
          <span class="card-label">Stream:</span>
          <span class="card-val" style="color: #a78bfa;">dMAT General Academic</span>
        </div>
        <div class="card-row">
          <span class="card-label">Registered Email:</span>
          <span class="card-val">${email}</span>
        </div>
        <div class="card-row">
          <span class="card-label">Temporary Password:</span>
          <span class="card-val" style="color: #34d399; font-size: 16px;">${newTempPassword}</span>
        </div>
      </div>

      <a href="${loginUrl}" class="btn">
        Login to Candidate Portal &rarr;
      </a>

      <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin-top: 24px;">
        💡 <em>Security Notice:</em> Please change your password upon your first login in your Account Settings. If you have questions, reply directly to this email or reach us on Instagram <a href="https://instagram.com/neuvexa.in" style="color: #60a5fa;">@neuvexa.in</a>.
      </p>
    </div>
    <div class="footer">
      © ${new Date().getFullYear()} MockOra • Developed by NeuVexa.in<br/>
      Need support? Contact <a href="mailto:neuvexa.services@gmail.com" style="color: #94a3b8;">neuvexa.services@gmail.com</a>
    </div>
  </div>
</body>
</html>
  `;

  console.log('Sending email to:', email);
  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || '"MockOra" <neuvexa.services@gmail.com>',
    to: email,
    subject: 'Order Confirmed: Your MockOra Login Credentials 🎉',
    html: htmlContent,
  });

  console.log('✅ Email sent successfully!');
  console.log('Message ID:', info.messageId);
  console.log('Response:', info.response);
  console.log(`🔑 Credentials sent: Email=${email} | Password=${newTempPassword}`);
}

sendCredentials().catch((e) => {
  console.error('Error sending credentials:', e);
  process.exit(1);
});

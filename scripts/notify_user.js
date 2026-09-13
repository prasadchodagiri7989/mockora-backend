require('dotenv').config();
const emailService = require('../src/utils/emailService');

async function main() {
  const res = await emailService.sendPasswordResetNoticeEmail({
    toEmail: 'prasadpk1433@gmail.com',
    customerName: 'Ch N V S S Durga Prasad',
    newPassword: 'Mock@Candidate2026',
  });
  console.log('Password notice email result:', res);
}

main().catch(console.error);

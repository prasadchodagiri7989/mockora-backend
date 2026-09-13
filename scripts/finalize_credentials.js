require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const emailService = require('../src/utils/emailService');

async function syncAndSend() {
  const email = 'prasad.cificap@gmail.com';
  const finalPassword = 'Mock@Prasad2026';
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(finalPassword, salt);

  const uris = [
    'mongodb://127.0.0.1:27017/universal_mock_test',
    'mongodb+srv://chodagiriprasad5:Prasad%40123@cluster0.w4dod.mongodb.net/mockora-backend?retryWrites=true&w=majority&appName=Cluster0'
  ];

  for (const uri of uris) {
    try {
      const conn = await mongoose.createConnection(uri).asPromise();
      await conn.db.collection('users').updateOne(
        { email },
        { $set: { password: hashedPassword, passwordTemporary: true, targetExam: 'dMAT General Academic', purchasedCategory: 'dMAT General Academic', updatedAt: new Date() } }
      );
      await conn.db.collection('orders').updateOne(
        { cashfreeOrderId: 'ORD_1789254081206_2391' },
        { $set: { temporaryPassword: finalPassword, credentialsSent: true, updatedAt: new Date() } }
      );
      console.log('Updated user and order in:', uri.includes('127.0.0.1') ? 'Local DB' : 'Atlas DB');
      await conn.close();
    } catch (e) {
      console.error('Error on uri:', e.message);
    }
  }

  // Dispatch email with subject and credentials
  const emailRes = await emailService.sendWelcomeEmail({
    toEmail: email,
    customerName: 'Ch N V S S Durga Prasad',
    temporaryPassword: finalPassword,
    category: 'dMAT General Academic',
    orderId: 'ORD_1789254081206_2391',
    transactionId: 'SIM_TXN_1789254105331',
    amountPaid: 999,
  });
  console.log('Final email dispatch result:', emailRes);
}

syncAndSend().catch(console.error);

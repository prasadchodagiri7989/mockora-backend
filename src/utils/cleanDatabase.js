require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Order = require('../models/Order');
const Attempt = require('../models/Attempt');

const cleanDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/universal_mock_test';
    await mongoose.connect(mongoUri);
    console.log('[CleanDB] Connected to MongoDB');

    // 1. Clear test orders & transactions
    const deletedOrders = await Order.deleteMany({});
    console.log(`[CleanDB] Cleared Orders/Transactions: ${deletedOrders.deletedCount} removed`);

    // 2. Clear student attempts
    const deletedAttempts = await Attempt.deleteMany({});
    console.log(`[CleanDB] Cleared Attempts: ${deletedAttempts.deletedCount} removed`);

    // 3. Clear all users
    await User.deleteMany({});
    console.log('[CleanDB] Cleared previous Users');

    // 4. Create Admin with user requested credentials
    // Admin email: chodagiriprasad5@gmail.com, password: Yashu@1818
    const adminUser = await User.create({
      name: 'Prasad Chodagiri',
      email: 'chodagiriprasad5@gmail.com',
      password: 'Yashu@1818',
      role: 'admin',
      status: 'active',
      targetExam: 'Administration & Curricula',
      streakDays: 14,
    });
    console.log(`[CleanDB] Created Admin: ${adminUser.email}`);

    // 5. Create 1 Student Example
    // Student email: student@universalmock.com, password: Student@123
    const studentUser = await User.create({
      name: 'Alex Rivera (Example Student)',
      email: 'student@universalmock.com',
      password: 'Student@123',
      role: 'user',
      status: 'active',
      targetExam: 'Computer Science & GATE',
      streakDays: 7,
      occupation: 'Student',
      purchasedCategory: 'Computer Science & IT',
    });
    console.log(`[CleanDB] Created Example Student: ${studentUser.email}`);

    // 6. Create 1 sample completed Order for the example student so Admin Transactions page has an example record
    const sampleOrder = await Order.create({
      name: studentUser.name,
      email: studentUser.email,
      mobile: '9876543210',
      category: 'Computer Science & IT',
      occupation: 'Student',
      amount: 999,
      originalAmount: 999,
      discountAmount: 0,
      status: 'paid',
      cashfreeOrderId: 'CF_ORD_EXAMPLE_1001',
      transactionId: 'CF_TXN_8849201948',
      cfPaymentId: '8849201948',
      bankReference: 'REF_994820',
      paymentMethod: 'UPI / NetBanking',
      paidAt: new Date(),
      userProvisioned: true,
      userId: studentUser._id,
      credentialsSent: true,
    });
    console.log(`[CleanDB] Created Example Transaction: ${sampleOrder.transactionId} for student`);

    console.log('\n======================================================');
    console.log('✅ DATABASE CLEANUP COMPLETE!');
    console.log('👑 Admin Credentials:');
    console.log('   Email:    chodagiriprasad5@gmail.com');
    console.log('   Password: Yashu@1818');
    console.log('');
    console.log('🎓 Example Student Credentials:');
    console.log('   Email:    student@universalmock.com');
    console.log('   Password: Student@123');
    console.log('======================================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('[CleanDB Error]', err);
    process.exit(1);
  }
};

cleanDatabase();

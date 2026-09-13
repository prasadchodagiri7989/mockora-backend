require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');

async function test() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/universal_mock_test');
  const user = await User.findOne({ email: 'prasadpk1433@gmail.com' });
  console.log('Found user:', user ? user.email : 'not found');

  if (user) {
    const testNewPass = 'Mock@Secure2026';
    user.password = testNewPass;
    await user.save();
    console.log('Saved user with new password');

    const updatedUser = await User.findById(user._id);
    const isMatch = await updatedUser.matchPassword(testNewPass);
    console.log('Password match test:', isMatch ? 'PASSED ✅' : 'FAILED ❌');
  }

  await mongoose.disconnect();
}

test().catch(console.error);

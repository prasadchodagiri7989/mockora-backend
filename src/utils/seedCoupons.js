require('dotenv').config();
const mongoose = require('mongoose');
const Coupon = require('../models/Coupon');

const sampleCoupons = [
  {
    code: 'WELCOME200',
    discountType: 'flat',
    discountValue: 200, // ₹200 off -> ₹799
    usageLimit: 500,
    usedCount: 12,
    active: true,
  },
  {
    code: 'SUPER50',
    discountType: 'percent',
    discountValue: 50, // 50% off -> ₹499
    usageLimit: 100,
    usedCount: 5,
    active: true,
  },
  {
    code: 'FLAT100',
    discountType: 'flat',
    discountValue: 100, // ₹100 off -> ₹899
    usageLimit: 1000,
    usedCount: 45,
    active: true,
  },
];

const seedCoupons = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/universal_mock_test';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for coupon seeding...');

    for (const c of sampleCoupons) {
      await Coupon.findOneAndUpdate({ code: c.code }, c, { upsert: true, new: true });
      console.log(`✓ Seeded coupon: ${c.code} (${c.discountType === 'flat' ? `₹${c.discountValue} OFF` : `${c.discountValue}% OFF`})`);
    }

    console.log('Coupons seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Coupon seed error:', err);
    process.exit(1);
  }
};

seedCoupons();

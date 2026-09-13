const mongoose = require('mongoose');

async function addCoupon() {
  const uris = [
    'mongodb://127.0.0.1:27017/universal_mock_test',
    'mongodb+srv://chodagiriprasad5:Prasad%40123@cluster0.w4dod.mongodb.net/mockora-backend?retryWrites=true&w=majority&appName=Cluster0'
  ];

  const couponDoc = {
    code: 'MOCK400',
    discountType: 'flat',
    discountValue: 400,
    expiryDate: new Date('2026-10-18T23:59:59.999Z'),
    usageLimit: 1000,
    usedCount: 0,
    active: true,
    updatedAt: new Date(),
  };

  for (const uri of uris) {
    try {
      const conn = await mongoose.createConnection(uri).asPromise();
      await conn.db.collection('coupons').updateOne(
        { code: 'MOCK400' },
        { $set: couponDoc, $setOnInsert: { createdAt: new Date() } },
        { upsert: true }
      );
      console.log('Successfully saved MOCK400 to:', uri.includes('127.0.0.1') ? 'Local DB' : 'Atlas DB');
      const saved = await conn.db.collection('coupons').findOne({ code: 'MOCK400' });
      console.log('Saved coupon verification:', {
        code: saved.code,
        discountType: saved.discountType,
        discountValue: saved.discountValue,
        expiryDate: saved.expiryDate,
        active: saved.active
      });
      await conn.close();
    } catch (err) {
      console.error('Error on uri:', err.message);
    }
  }
}

addCoupon().catch(console.error);

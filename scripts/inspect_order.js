require('dotenv').config();
const mongoose = require('mongoose');

async function inspect(uri, label) {
  console.log(`\n=== Checking ${label} (${uri}) ===`);
  const conn = await mongoose.createConnection(uri).asPromise();
  const Order = conn.db.collection('orders');
  const User = conn.db.collection('users');

  const orders = await Order.find({}).toArray();
  console.log(`Total orders in ${label}:`, orders.length);
  orders.forEach(o => {
    console.log(`- Order: id=${o.orderId || o.cashfreeOrderId} email=${o.email} status=${o.status} provisioned=${o.userProvisioned} userId=${o.userId}`);
  });

  const specificOrder = await Order.findOne({
    $or: [{ orderId: 'ORD_1789252037185_8701' }, { cashfreeOrderId: 'ORD_1789252037185_8701' }]
  });
  console.log('Specific Order found:', specificOrder);

  const user = await User.findOne({ email: 'prasadpk1433@gmail.com' });
  console.log('User found in DB:', user ? { _id: user._id, email: user.email, name: user.name, passwordTemporary: user.passwordTemporary } : null);

  await conn.close();
}

async function main() {
  const localUri = 'mongodb://127.0.0.1:27017/universal_mock_test';
  const atlasUri = 'mongodb+srv://chodagiriprasad5:Prasad%40123@cluster0.w4dod.mongodb.net/mockora-backend?retryWrites=true&w=majority&appName=Cluster0';
  
  await inspect(localUri, 'Local MongoDB');
  await inspect(atlasUri, 'Atlas MongoDB');
}

main().catch(console.error);

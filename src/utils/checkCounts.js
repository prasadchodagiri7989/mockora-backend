require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');

async function checkCounts() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/universal_mock_test';
  await mongoose.connect(mongoUri);

  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log('--- Current Collections and Counts ---');
  for (const col of collections) {
    const count = await mongoose.connection.db.collection(col.name).countDocuments();
    console.log(`${col.name}: ${count}`);
  }
  await mongoose.disconnect();
}

checkCounts().catch(console.error);

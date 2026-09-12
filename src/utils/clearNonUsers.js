require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');

const clearNonUsers = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/universal_mock_test';
    await mongoose.connect(mongoUri);
    console.log('[ClearDB] Connected to MongoDB');

    const db = mongoose.connection.db;

    // Get all collection names
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    console.log('[ClearDB] Found collections:', collectionNames.join(', '));

    // Collections to keep intact
    const skipCollections = ['users'];

    let cleared = 0;
    for (const name of collectionNames) {
      if (skipCollections.includes(name)) {
        console.log(`[ClearDB] ⏭  SKIPPED (preserving): ${name}`);
        continue;
      }
      const result = await db.collection(name).deleteMany({});
      console.log(`[ClearDB] 🗑  Cleared collection "${name}": ${result.deletedCount} documents removed`);
      cleared++;
    }

    console.log('\n======================================================');
    console.log(`✅ DONE! Cleared ${cleared} collection(s). "users" table preserved.`);
    console.log('======================================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('[ClearDB Error]', err);
    process.exit(1);
  }
};

clearNonUsers();

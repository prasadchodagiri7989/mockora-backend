const mongoose = require('mongoose');

const LOCAL_URI = process.env.LOCAL_MONGODB_URI || 'mongodb://127.0.0.1:27017/universal_mock_test';
const ATLAS_URI = process.env.ATLAS_MONGODB_URI || 'mongodb+srv://chodagiriprasad5:Prasad%40123@cluster0.w4dod.mongodb.net/mockora-backend?retryWrites=true&w=majority&appName=Cluster0';

async function migrate() {
  console.log(`Connecting to local MongoDB at: ${LOCAL_URI}`);
  const localConn = await mongoose.createConnection(LOCAL_URI).asPromise();
  console.log('Connected to local MongoDB.');

  console.log(`Connecting to MongoDB Atlas...`);
  const atlasConn = await mongoose.createConnection(ATLAS_URI).asPromise();
  console.log('Connected to MongoDB Atlas.');

  const collections = await localConn.db.listCollections().toArray();
  console.log(`\nFound ${collections.length} collections in local database.`);

  for (const col of collections) {
    const colName = col.name;
    if (colName.startsWith('system.')) continue;

    const localColl = localConn.db.collection(colName);
    const atlasColl = atlasConn.db.collection(colName);

    const count = await localColl.countDocuments();
    console.log(`\n========================================`);
    console.log(`Processing collection: "${colName}" (Local docs: ${count})`);
    console.log(`========================================`);

    if (count === 0) {
      console.log(`Collection "${colName}" is empty locally. Skipping document copy.`);
      continue;
    }

    const docs = await localColl.find({}).toArray();

    // Clear existing docs in Atlas for clean sync
    try {
      const delResult = await atlasColl.deleteMany({});
      console.log(`Cleared ${delResult.deletedCount} existing documents in Atlas collection "${colName}".`);
    } catch (err) {
      console.log(`Notice on clearing Atlas collection: ${err.message}`);
    }

    // Insert in chunks of 100
    const chunkSize = 100;
    let insertedCount = 0;
    for (let i = 0; i < docs.length; i += chunkSize) {
      const chunk = docs.slice(i, i + chunkSize);
      const res = await atlasColl.insertMany(chunk, { ordered: false });
      insertedCount += Object.keys(res.insertedIds || {}).length;
    }

    const atlasCount = await atlasColl.countDocuments();
    console.log(`[SUCCESS] "${colName}" migrated: ${insertedCount} inserted. Verified Atlas count: ${atlasCount}`);
  }

  // Copy indexes
  console.log(`\n========================================`);
  console.log(`Synchronizing indexes...`);
  console.log(`========================================`);
  for (const col of collections) {
    const colName = col.name;
    if (colName.startsWith('system.')) continue;
    try {
      const indexes = await localConn.db.collection(colName).indexes();
      for (const idx of indexes) {
        if (idx.name === '_id_') continue;
        const options = { name: idx.name };
        if (idx.unique) options.unique = true;
        if (idx.sparse) options.sparse = true;
        await atlasConn.db.collection(colName).createIndex(idx.key, options);
      }
      console.log(`Synced index definitions for "${colName}".`);
    } catch (e) {
      console.log(`Index note for "${colName}": ${e.message}`);
    }
  }

  await localConn.close();
  await atlasConn.close();
  console.log(`\n✨ Seeding to MongoDB Atlas completed successfully!`);
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});

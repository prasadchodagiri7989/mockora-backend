const mongoose = require('mongoose');
async function sync() {
  const localConn = await mongoose.createConnection('mongodb://127.0.0.1:27017/universal_mock_test').asPromise();
  const atlasConn = await mongoose.createConnection('mongodb+srv://chodagiriprasad5:Prasad%40123@cluster0.w4dod.mongodb.net/mockora-backend?retryWrites=true&w=majority&appName=Cluster0').asPromise();

  const localUser = await localConn.db.collection('users').findOne({ email: 'prasadpk1433@gmail.com' });
  if (localUser) {
    const { _id, ...fields } = localUser;
    await atlasConn.db.collection('users').updateOne(
      { email: 'prasadpk1433@gmail.com' },
      { $set: fields },
      { upsert: true }
    );
    console.log('Synchronized user to Atlas successfully!');
  }

  await localConn.close();
  await atlasConn.close();
}
sync().catch(console.error);

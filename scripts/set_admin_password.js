const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function setAdminPw() {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash('Yashu@1818', salt);

  const uris = [
    'mongodb://127.0.0.1:27017/universal_mock_test',
    'mongodb+srv://chodagiriprasad5:Prasad%40123@cluster0.w4dod.mongodb.net/mockora-backend?retryWrites=true&w=majority&appName=Cluster0'
  ];

  for (const uri of uris) {
    try {
      const conn = await mongoose.createConnection(uri).asPromise();
      await conn.db.collection('users').updateOne(
        { email: 'chodagiriprasad5@gmail.com' },
        { $set: { password: hash, role: 'admin' } }
      );
      console.log('Admin password set to Yashu@1818 in:', uri.includes('127.0.0.1') ? 'Local DB' : 'Atlas DB');
      await conn.close();
    } catch (e) {
      console.error(e.message);
    }
  }
}

setAdminPw().catch(console.error);

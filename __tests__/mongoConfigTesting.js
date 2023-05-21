//// mongoConfigTesting.js
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { default: models } = require('../src/models');

let mongo = null;

async function connectDB() {
  const mongo = await MongoMemoryServer.create();
  const mongoUri = mongo.getUri();

  mongoose.connect(mongoUri);

  mongoose.connection.on('error', (e) => {
    if (e.message.code === 'ETIMEDOUT') {
      console.log(e);
      mongoose.connect(mongoUri);
    }
    console.log(e);
  });

  mongoose.connection.once('open', () => {
    console.log(`MongoDB successfully connected to ${mongoUri}`);
  });
}

async function dropDB() {
  if (mongo) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongo.stop();
  }
}

module.exports = { connectDB, dropDB };

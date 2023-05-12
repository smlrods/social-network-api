import mongoose from 'mongoose';
import 'dotenv/config';

const mongoDB = process.env.MONGODB_URL;

async function initializeMongoServer() {
  await mongoose.connect(mongoDB);

  mongoose.connection.on('error', (e) => {
    if (e.message.code === 'ETIMEDOUT') {
      console.log(e);
      mongoose.connect(mongoDB);
    }
    console.log(e);
  });

  mongoose.connection.once('open', () => {
    console.log(`MongoDB successfully connected to ${mongoUri}`);
  });
}

export default initializeMongoServer;

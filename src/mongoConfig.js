import mongoose from 'mongoose';
import 'dotenv/config';

const mongoDB = process.env.MONGODB_URL;

main().catch((err) => console.log(err));
async function main() {
  await mongoose.connect(mongoDB);
}

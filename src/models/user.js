import mongoose from 'mongoose';

const { Schema } = mongoose;

const UserSchema = new Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  profile_image: { type: String, required: true },
  fullname: { type: String, required: true },
});

export default mongoose.model('User', UserSchema);

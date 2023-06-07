import mongoose from 'mongoose';

const { Schema } = mongoose;
const defaultUserImage = '';

const UserSchema = new Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  profile_image: { type: String, default: defaultUserImage },
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
});

UserSchema.virtual('fullname').get(function () {
  return `${this.first_name} ${this.last_name}`;
});

export default mongoose.model('User', UserSchema);

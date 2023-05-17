import mongoose from 'mongoose';

const { Schema } = mongoose;

const UserSchema = new Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  profile_image: { type: String, required: true },
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
});

UserSchema.virtual('fullname').get(function () {
  return `${this.first_name} ${this.last_name}`;
});

export default mongoose.model('User', UserSchema);

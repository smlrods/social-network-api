import mongoose from 'mongoose';

const { Schema } = mongoose;
const defaultUserImage =
  'https://avatars.githubusercontent.com/u/84884629?s=400&u=800be1277201b1f51b9048f404c06e8bf0e5a194&v=4';

const UserSchema = new Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  profile_image: { type: String, required: true, default: defaultUserImage },
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
});

UserSchema.virtual('fullname').get(function () {
  return `${this.first_name} ${this.last_name}`;
});

export default mongoose.model('User', UserSchema);

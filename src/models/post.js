import mongoose from 'mongoose';

const { Schema } = mongoose;

const PostSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  body: { type: String, required: true },
  image: { type: String },
});

export default mongoose.model('Post', PostSchema);

import mongoose from 'mongoose';

const { Schema } = mongoose;

const LikeSchema = new Schema({
  post: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
});

export default mongoose.model('Like', LikeSchema);

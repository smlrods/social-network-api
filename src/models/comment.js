import mongoose from 'mongoose';

const { Schema } = mongoose;

const CommentSchema = new Schema({
  post: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  body: { type: String, required: true },
});

export default mongoose.model('Comment', CommentSchema);

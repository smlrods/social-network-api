import mongoose from 'mongoose';

const { Schema } = mongoose;

const RequestSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  friend: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'refused'],
    required: true,
    default: 'pending',
  },
});

export default mongoose.model('Request', RequestSchema);

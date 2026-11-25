import mongoose from 'mongoose';

const watchProgressSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  video: { type: mongoose.Schema.Types.ObjectId, ref: 'Video', required: true },
  seconds: { type: Number, default: 0, min: 0 },
  completed: { type: Boolean, default: false }
}, { timestamps: true });

watchProgressSchema.index({ user: 1, video: 1 }, { unique: true });
export default mongoose.model('WatchProgress', watchProgressSchema);

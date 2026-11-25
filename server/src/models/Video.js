import mongoose from 'mongoose';

const videoSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  description: { type: String, default: '', maxlength: 3000 },
  streamUid: { type: String, required: true, unique: true },
  thumbnail: { type: String, default: '' },
  durationSeconds: { type: Number, default: 0 },
  published: { type: Boolean, default: false },
  order: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model('Video', videoSchema);

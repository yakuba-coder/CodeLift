import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 120 },
  slug: { type: String, required: true, unique: true, lowercase: true },
  description: { type: String, default: '', maxlength: 2000 },
  published: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('Course', courseSchema);

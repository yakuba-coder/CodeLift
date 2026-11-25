import { Router } from 'express';
import { z } from 'zod';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import Video from '../models/Video.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { createDirectUpload } from '../services/cloudflare.js';

const router = Router();
router.use(requireAuth, requireAdmin);

router.get('/pending-users', async (req, res, next) => {
  try {
    const users = await User.find({ role: 'student', status: 'pending' }).select('name email createdAt').sort({ createdAt: 1 });
    res.json({ users });
  } catch (e) { next(e); }
});

router.patch('/users/:id/approval', async (req, res, next) => {
  try {
    const status = z.enum(['approved', 'rejected']).safeParse(req.body.status);
    if (!status.success) return res.status(400).json({ message: 'Status must be approved or rejected.' });
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'student', status: 'pending' },
      { status: status.data, ...(status.data === 'approved' ? { approvedAt: new Date() } : {}) },
      { new: true }
    ).select('name email status');
    if (!user) return res.status(404).json({ message: 'Pending student not found.' });
    res.json({ user });
  } catch (e) { next(e); }
});


router.get('/courses', async (req, res, next) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 });
    res.json({ courses });
  } catch (e) { next(e); }
});

router.get('/courses/:courseId/videos', async (req, res, next) => {
  try {
    const videos = await Video.find({ course: req.params.courseId }).select('title description published streamUid createdAt').sort({ createdAt: -1 });
    res.json({ videos });
  } catch (e) { next(e); }
});

router.post('/courses', async (req, res, next) => {
  try {
    const parsed = z.object({ title: z.string().trim().min(3).max(120), slug: z.string().trim().regex(/^[a-z0-9-]+$/), description: z.string().max(2000).optional() }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: 'Enter a title and URL-safe slug.' });
    const course = await Course.create(parsed.data);
    res.status(201).json({ course });
  } catch (e) { next(e); }
});

router.patch('/courses/:id/publish', async (req, res, next) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, { published: Boolean(req.body.published) }, { new: true });
    if (!course) return res.status(404).json({ message: 'Course not found.' });
    res.json({ course });
  } catch (e) { next(e); }
});

router.get('/enrollments/pending', async (req, res, next) => {
  try {
    const enrollments = await Enrollment.find({ status: 'pending' }).populate('user', 'name email').populate('course', 'title');
    res.json({ enrollments });
  } catch (e) { next(e); }
});

router.patch('/enrollments/:id/approval', async (req, res, next) => {
  try {
    const status = z.enum(['approved', 'rejected']).safeParse(req.body.status);
    if (!status.success) return res.status(400).json({ message: 'Status must be approved or rejected.' });
    const enrollment = await Enrollment.findOneAndUpdate(
      { _id: req.params.id, status: 'pending' },
      { status: status.data, ...(status.data === 'approved' ? { approvedAt: new Date() } : {}) },
      { new: true }
    );
    if (!enrollment) return res.status(404).json({ message: 'Pending enrollment not found.' });
    res.json({ enrollment });
  } catch (e) { next(e); }
});

router.post('/videos/direct-upload', async (req, res, next) => {
  try {
    const parsed = z.object({
      courseId: z.string().min(1),
      title: z.string().trim().min(2).max(160),
      description: z.string().max(3000).optional()
    }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: 'Video title and course are required.' });
    const course = await Course.findById(parsed.data.courseId);
    if (!course) return res.status(404).json({ message: 'Course not found.' });
    const upload = await createDirectUpload();
    await Video.create({
      course: course.id, title: parsed.data.title, description: parsed.data.description || '',
      streamUid: upload.uid, published: false
    });
    res.status(201).json({ uploadUrl: upload.uploadURL, videoUid: upload.uid, message: 'Upload URL created. Video remains unpublished until you publish it.' });
  } catch (e) { next(e); }
});

router.patch('/videos/:id/publish', async (req, res, next) => {
  try {
    const video = await Video.findByIdAndUpdate(req.params.id, { published: Boolean(req.body.published) }, { new: true });
    if (!video) return res.status(404).json({ message: 'Video not found.' });
    res.json({ video });
  } catch (e) { next(e); }
});

export default router;

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import argon2 from 'argon2';
import User from './models/User.js';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import learningRoutes from './routes/learning.js';
import { notFound, errorHandler } from './middleware/errors.js';

const app = express();
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'codelift-api' }));
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/learning', learningRoutes);
app.use(notFound);
app.use(errorHandler);

async function bootstrapAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.warn('ADMIN_EMAIL/ADMIN_PASSWORD not set; no admin bootstrap performed.');
    return;
  }
  const existing = await User.findOne({ email });
  if (existing) {
    if (existing.role !== 'admin') throw new Error('ADMIN_EMAIL is already used by a non-admin account.');
    return;
  }
  const passwordHash = await argon2.hash(password);
  await User.create({ name: process.env.ADMIN_NAME || 'CodeLift Admin', email, passwordHash, role: 'admin', status: 'approved', approvedAt: new Date() });
  console.log(`Initial administrator provisioned: ${email}`);
}

const port = Number(process.env.PORT || 5000);
connectDB().then(bootstrapAdmin).then(() => {
  app.listen(port, '0.0.0.0', () => console.log(`CodeLift API listening on ${port}`));
}).catch(err => {
  console.error('Startup failed:', err);
  process.exit(1);
});

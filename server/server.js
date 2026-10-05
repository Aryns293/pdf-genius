import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import passport from 'passport';

import './config/passport.js';
import authRoutes from './routes/auth.js';
import uploadRoutes from './routes/upload.js';
import queryRoutes from './routes/query.js';
import filesRoutes from './routes/files.js';

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/query', queryRoutes);
app.use('/api/files', filesRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

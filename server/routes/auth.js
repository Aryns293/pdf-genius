import express from 'express';
import { completeGoogleSignIn, getCurrentUser, logout } from '../controllers/auth.js';
import { authenticate } from '../middleware/auth.js';
import { requireGoogleAuthConfig, googleSignIn, googleCallback } from '../middleware/googleAuth.js';

const router = express.Router();

router.get('/google', requireGoogleAuthConfig, googleSignIn);
router.get('/google/callback', requireGoogleAuthConfig, googleCallback, completeGoogleSignIn);
router.get('/me', authenticate, getCurrentUser);
router.post('/logout', logout);

export default router;

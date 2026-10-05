import express from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { authenticate } from '../middleware/auth.js';
import { isGoogleAuthConfigured } from '../config/passport.js';

const router = express.Router();

function requireGoogleAuthConfig(_req, res, next) {
  if (!isGoogleAuthConfigured) {
    return res.status(500).json({ error: 'Google OAuth is not configured on the server.' });
  }
  next();
}

router.get(
  '/google',
  requireGoogleAuthConfig,
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

router.get(
  '/google/callback',
  requireGoogleAuthConfig,
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.CLIENT_URL}/login` }),
  (req, res) => {
    const token = jwt.sign(
      { id: req.user.id, name: req.user.name, email: req.user.email, image: req.user.image },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.redirect(process.env.CLIENT_URL);
  }
);

router.get('/me', authenticate, (req, res) => res.json({ user: req.user }));

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true });
});

export default router;

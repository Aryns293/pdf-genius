import passport from 'passport';
import { isGoogleAuthConfigured } from '../config/passport.js';

export function requireGoogleAuthConfig(_req, res, next) {
  if (!isGoogleAuthConfigured) {
    return res.status(500).json({ error: 'Google OAuth is not configured on the server.' });
  }
  next();
}

export const googleSignIn = passport.authenticate('google', { scope: ['profile', 'email'], session: false });

export const googleCallback = passport.authenticate('google', {
  session: false,
  failureRedirect: `${process.env.CLIENT_URL}/login`,
});

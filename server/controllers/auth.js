import jwt from 'jsonwebtoken';

export function completeGoogleSignIn(req, res) {
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

export function getCurrentUser(req, res) {
  return res.json({ user: req.user });
}

export function logout(_req, res) {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
  res.json({ success: true });
}

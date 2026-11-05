export function validateQuestion(req, res, next) {
  const { question } = req.body;
  if (!question || typeof question !== 'string') return res.status(400).json({ error: 'Question is required' });
  if (question.trim().length === 0) return res.status(400).json({ error: 'Question cannot be empty' });
  next();
}

export function validateFileName(req, res, next) {
  if (!req.query.fileName) return res.status(400).json({ error: 'File name is required' });
  next();
}

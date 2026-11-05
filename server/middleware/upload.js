import multer from 'multer';
import { validatePDFBuffer } from '../lib/pdfProcessor.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 4 * 1024 * 1024 } });

export const parsePDFUpload = upload.single('file');

export function validatePDFUpload(req, res, next) {
  console.log('Upload API called');
  if (!process.env.PINECONE_API_KEY) return res.status(500).json({ error: 'Server configuration error: Missing Pinecone API key' });

  const file = req.file;
  if (!file) return res.status(400).json({ error: 'No file provided', hint: "Make sure to include a 'file' field in your form data" });
  if (file.mimetype !== 'application/pdf') return res.status(400).json({ error: 'Only PDF files are allowed', receivedType: file.mimetype });

  const validation = validatePDFBuffer(file.buffer);
  if (!validation.isValid) return res.status(400).json({ error: 'Invalid PDF file', details: validation.error });
  next();
}

export function handleUploadError(err, _req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 4MB' });
    }
    return res.status(400).json({ error: err.message });
  }
  next(err);
}

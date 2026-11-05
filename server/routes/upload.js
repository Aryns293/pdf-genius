import express from 'express';
import { uploadPDF } from '../controllers/upload.js';
import { authenticate } from '../middleware/auth.js';
import { parsePDFUpload, validatePDFUpload, handleUploadError } from '../middleware/upload.js';

const router = express.Router();

router.post('/', authenticate, parsePDFUpload, validatePDFUpload, uploadPDF);
router.use(handleUploadError);

export default router;

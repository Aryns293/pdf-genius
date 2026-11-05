import express from 'express';
import { listFiles, deleteFile } from '../controllers/files.js';
import { authenticate } from '../middleware/auth.js';
import { validateFileName } from '../middleware/validation.js';

const router = express.Router();

router.get('/', authenticate, listFiles);
router.delete('/', authenticate, validateFileName, deleteFile);

export default router;

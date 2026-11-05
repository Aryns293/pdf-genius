import express from 'express';
import { askQuestion } from '../controllers/query.js';
import { authenticate } from '../middleware/auth.js';
import { handleQueryError } from '../middleware/queryError.js';
import { validateQuestion } from '../middleware/validation.js';

const router = express.Router();

router.post('/', authenticate, validateQuestion, askQuestion);
router.use(handleQueryError);

export default router;

import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { getAllUserFiles, deleteVectors } from '../lib/pinecone.js';

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const data = await getAllUserFiles(userId);
    return res.json({ files: data.files, count: data.files.length, totalChunks: data.totalChunks });
  } catch (error) {
    console.error('Error getting user files:', error);
    return res.status(500).json({ error: `Failed to get files: ${error.message}` });
  }
});

router.delete('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const fileName = req.query.fileName;
    if (!fileName) return res.status(400).json({ error: 'File name is required' });
    await deleteVectors(userId, fileName);
    return res.json({ success: true, message: `Successfully deleted file: ${fileName}` });
  } catch (error) {
    console.error('Error deleting file:', error);
    return res.status(500).json({ error: `Failed to delete file: ${error.message}` });
  }
});

export default router;

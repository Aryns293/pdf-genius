import express from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth.js';
import { processPDFToChunks, generateChunkId, validatePDFBuffer } from '../lib/pdfProcessor.js';
import { upsertRecords } from '../lib/pinecone.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.post('/', authenticate, upload.single('file'), async (req, res) => {
  console.log('📤 Upload API called');
  try {
    if (!process.env.PINECONE_API_KEY) return res.status(500).json({ error: 'Server configuration error: Missing Pinecone API key' });

    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file provided', hint: "Make sure to include a 'file' field in your form data" });
    if (file.mimetype !== 'application/pdf') return res.status(400).json({ error: 'Only PDF files are allowed', receivedType: file.mimetype });

    const userId = req.user.id;
    const fileName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const buffer = file.buffer;

    const validation = validatePDFBuffer(buffer);
    if (!validation.isValid) return res.status(400).json({ error: 'Invalid PDF file', details: validation.error });

    let processedChunks;
    try {
      processedChunks = await processPDFToChunks(buffer);
      if (processedChunks.length === 0) throw new Error('No text content could be extracted from the PDF');
    } catch (error) {
      return res.status(400).json({
        error: 'Failed to process PDF',
        details: error.message,
        troubleshooting: 'Visit /diagnostic to run system diagnostics',
      });
    }

    const pdfChunks = processedChunks.map((chunk, index) => ({
      id: generateChunkId(userId, fileName, index),
      text: chunk.text,
      metadata: {
        userId,
        fileName,
        pageNumber: chunk.pageNumber,
        chunkIndex: index,
        uploadedAt: new Date().toISOString(),
      },
    }));

    try {
      await upsertRecords(pdfChunks);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to store PDF records in database', details: error.message });
    }

    const stats = {
      originalFileSize: file.size,
      processedChunks: processedChunks.length,
      averageChunkSize: Math.round(processedChunks.reduce((s, c) => s + c.text.length, 0) / processedChunks.length),
      totalTextLength: processedChunks.reduce((s, c) => s + c.text.length, 0),
    };

    return res.json({
      success: true,
      message: `Successfully processed PDF: ${fileName}`,
      chunksCreated: pdfChunks.length,
      fileName,
      processingStats: stats,
    });
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return res.status(500).json({ error: 'An unexpected error occurred while processing the PDF' });
  }
});

export default router;

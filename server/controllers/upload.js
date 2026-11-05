import { processPDFToChunks, generateChunkId } from '../lib/pdfProcessor.js';
import { deleteVectors, upsertRecords } from '../lib/pinecone.js';

export async function uploadPDF(req, res) {
  try {
    const file = req.file;
    const userId = req.user.id;
    const fileName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const buffer = file.buffer;

    let processedChunks;
    try {
      processedChunks = await processPDFToChunks(buffer);
      if (processedChunks.length === 0) throw new Error('No text content could be extracted from the PDF');
    } catch (error) {
      return res.status(400).json({
        error: 'Failed to process PDF',
        details: error.message,
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
      await deleteVectors(userId, fileName);
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
    console.error('Unexpected error:', error);
    return res.status(500).json({ error: 'An unexpected error occurred while processing the PDF' });
  }
}

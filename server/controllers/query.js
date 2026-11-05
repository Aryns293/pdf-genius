import { generateResponse } from '../lib/gemini.js';
import { searchRecords } from '../lib/pinecone.js';

export async function askQuestion(req, res, next) {
  try {
    const userId = req.user.id;
    const { question } = req.body;

    const searchResults = await searchRecords(question, userId, 20);
    const relevantChunks = [];
    const seenChunks = new Set();

    for (const chunk of searchResults) {
      const key = `${chunk.metadata.fileName}\0${chunk.metadata.pageNumber}\0${chunk.text.trim()}`;
      if (seenChunks.has(key)) continue;
      seenChunks.add(key);
      relevantChunks.push(chunk);
      if (relevantChunks.length === 8) break;
    }

    if (relevantChunks.length === 0) {
      return res.status(404).json({ error: 'No relevant content found. Please upload a PDF document first.' });
    }

    const context = relevantChunks.map(
      (chunk, index) => `[Source ${index + 1}: ${chunk.metadata.fileName}, page ${chunk.metadata.pageNumber}]\n${chunk.text}`
    );
    const answer = await generateResponse(question, context);

    return res.json({
      answer,
      sources: relevantChunks.map((chunk, index) => ({
        id: index + 1,
        content: chunk.text.substring(0, 200) + (chunk.text.length > 200 ? '...' : ''),
        fileName: chunk.metadata.fileName,
        pageNumber: chunk.metadata.pageNumber,
        score: Math.round(chunk.score * 100) / 100,
      })),
      question,
    });
  } catch (error) {
    next(error);
  }
}

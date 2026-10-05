import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { generateEmbedding, generateResponse } from '../lib/gemini.js';
import { queryVectors } from '../lib/pinecone.js';

const router = express.Router();

router.post('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { question } = req.body;

    if (!question || typeof question !== 'string') return res.status(400).json({ error: 'Question is required' });
    if (question.trim().length === 0) return res.status(400).json({ error: 'Question cannot be empty' });

    const embedding = await generateEmbedding(question);
    const relevantChunks = await queryVectors(embedding, userId, 5);

    if (relevantChunks.length === 0) {
      return res.status(404).json({ error: 'No relevant content found. Please upload a PDF document first.' });
    }

    const context = relevantChunks.map((c) => c.text);
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
    console.error('Error processing query:', error);
    let errorMessage = error.message;
    let statusCode = 500;

    if (error.message?.includes('overloaded')) {
      errorMessage = 'The AI service is currently experiencing high demand. Please try again in a few moments.';
      statusCode = 503;
    } else if (error.message?.includes('Rate limit exceeded')) {
      errorMessage = 'Too many requests. Please wait a moment before trying again.';
      statusCode = 429;
    } else if (error.message?.includes('API key not valid')) {
      errorMessage = 'Configuration error. Please contact support.';
    } else if (error.message?.includes('Failed to generate response')) {
      errorMessage = 'Unable to generate a response at this time. Please try again.';
    }
    return res.status(statusCode).json({ error: errorMessage });
  }
});

export default router;

import pdfParse from 'pdf-parse/lib/pdf-parse.js';

const DEBUG = process.env.NODE_ENV === 'development';

export async function extractTextFromPDF(buffer) {
  try {
    if (DEBUG) console.log('📖 Starting PDF text extraction...');
    if (!buffer || buffer.length === 0) throw new Error('Invalid or empty PDF buffer');
    const pdfHeader = buffer.toString('ascii', 0, 4);
    if (pdfHeader !== '%PDF') throw new Error('Invalid PDF file: Missing PDF header');

    const data = await pdfParse(buffer);
    if (data && data.text && data.text.trim().length > 0) {
      if (DEBUG) console.log('✅ Successfully extracted text');
      return data.text;
    }
    throw new Error('Failed to extract text from PDF. The file might be password protected, corrupted, or contain only images.');
  } catch (error) {
    if (DEBUG) console.error('❌ PDF extraction error:', error);
    throw new Error(`PDF text extraction failed: ${error.message}`);
  }
}

export function cleanText(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/\s+/g, ' ')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function splitTextIntoChunks(text, chunkSize = 1000, overlap = 200) {
  if (!text || text.trim().length === 0) return [];
  const chunks = [];
  const sentences = text.split(/(?<=[.!?])\s+(?=[A-Z])/).filter((s) => s.trim().length > 0);
  let currentChunk = '';
  let currentChunkIndex = 0;
  let currentPageNumber = 1;
  const avgCharsPerPage = 2500;

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i].trim();
    if (!sentence) continue;

    if (currentChunk.length + sentence.length + 1 > chunkSize && currentChunk.length > 0) {
      chunks.push({ text: currentChunk.trim(), pageNumber: currentPageNumber, chunkIndex: currentChunkIndex });
      const words = currentChunk.split(/\s+/);
      const overlapWords = Math.min(Math.floor(overlap / 6), words.length);
      const overlapText = words.slice(-overlapWords).join(' ');
      currentChunk = overlapText ? overlapText + ' ' + sentence : sentence;
      currentChunkIndex++;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
    }

    const totalChars = chunks.reduce((s, c) => s + c.text.length, 0) + currentChunk.length;
    currentPageNumber = Math.max(1, Math.ceil(totalChars / avgCharsPerPage));
  }

  if (currentChunk.trim().length > 0) {
    chunks.push({ text: currentChunk.trim(), pageNumber: currentPageNumber, chunkIndex: currentChunkIndex });
  }
  return chunks;
}

export async function processPDFToChunks(buffer, chunkSize = 1000, overlap = 200) {
  try {
    if (DEBUG) console.log('🔄 Processing PDF to chunks...');
    if (!buffer || buffer.length === 0) throw new Error('Invalid PDF buffer provided');

    const text = await extractTextFromPDF(buffer);
    if (text.length === 0) throw new Error('No text content found in PDF');

    const cleanedText = cleanText(text);
    if (cleanedText.length === 0) throw new Error('No valid text content after cleaning');

    const chunks = splitTextIntoChunks(cleanedText, chunkSize, overlap);
    if (chunks.length === 0) throw new Error('Failed to create text chunks from PDF content');

    const validChunks = chunks.filter((c) => c.text && c.text.trim().length > 0);
    if (validChunks.length === 0) throw new Error('All created chunks are empty');

    return validChunks;
  } catch (error) {
    if (DEBUG) console.error('❌ Processing error:', error);
    if (error.message?.includes('Invalid PDF')) throw new Error('The uploaded file is not a valid PDF document');
    if (error.message?.includes('password')) throw new Error('This PDF is password protected and cannot be processed');
    throw error;
  }
}

export function generateChunkId(userId, fileName, chunkIndex) {
  const sanitized = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `${userId}-${sanitized}-${chunkIndex}-${Date.now()}`;
}

export function validatePDFBuffer(buffer) {
  if (!buffer || buffer.length === 0) return { isValid: false, error: 'Empty or invalid buffer' };
  if (buffer.length < 100) return { isValid: false, error: 'File too small to be a valid PDF' };
  const header = buffer.toString('ascii', 0, 4);
  if (header !== '%PDF') return { isValid: false, error: 'Invalid PDF file format' };
  return { isValid: true };
}

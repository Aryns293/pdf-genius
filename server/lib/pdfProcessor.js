import pdfParse from 'pdf-parse/lib/pdf-parse.js';

const DEBUG = process.env.NODE_ENV === 'development';

function renderPage(pageData) {
  return pageData.getTextContent({ normalizeWhitespace: false, disableCombineTextItems: false }).then((textContent) => {
    let lastY;
    let text = '';
    for (const item of textContent.items) {
      if (lastY === undefined || lastY === item.transform[5]) {
        text += item.str;
      } else {
        text += '\n' + item.str;
      }
      lastY = item.transform[5];
    }
    return text;
  });
}

export async function extractPagesFromPDF(buffer) {
  if (DEBUG) console.log('📖 Starting PDF page extraction...');
  if (!buffer || buffer.length === 0) throw new Error('Invalid or empty PDF buffer');
  if (buffer.toString('ascii', 0, 4) !== '%PDF') throw new Error('Invalid PDF file: Missing PDF header');

  const pages = new Map();

  await pdfParse(buffer, {
    pagerender: async (pageData) => {
      const text = await renderPage(pageData);
      const pageNumber = Number.isInteger(pageData.pageNumber)
        ? pageData.pageNumber
        : Number.isInteger(pageData.pageIndex)
          ? pageData.pageIndex + 1
          : pages.size + 1;
      pages.set(pageNumber, text);
      return text;
    },
  });

  if (pages.size === 0) {
    throw new Error('Failed to extract text from PDF. The file might be corrupted or contain only images.');
  }

  if (DEBUG) console.log(`✅ Extracted ${pages.size} page(s)`);
  return [...pages.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([pageNumber, text]) => ({ pageNumber, text }));
}

export function cleanText(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitIntoSentences(text) {
  return text.split(/(?<=[.!?])\s+(?=[A-Z])/).filter((s) => s.trim().length > 0).map((s) => s.trim());
}

// Tables, URLs and reference lists can produce a single "sentence" far longer than the chunk budget.
function splitLongSentence(sentence, limit) {
  const parts = [];
  let buffer = '';
  for (let word of sentence.split(/\s+/)) {
    if (!word) continue;
    // An extremely long word or URL can exceed the chunk limit on its own
    while (word.length > limit) {
      if (buffer) {
        parts.push(buffer);
        buffer = '';
      }
      parts.push(word.slice(0, limit));
      word = word.slice(limit);
    }
    if (!word) continue;

    if (buffer && buffer.length + word.length + 1 > limit) {
      parts.push(buffer);
      buffer = word;
    } else {
      buffer += (buffer ? ' ' : '') + word;
    }
  }
  if (buffer) parts.push(buffer);
  return parts;
}

function overlapTail(chunk, overlapWords, maxOverlapChars) {
  if (!overlapWords || overlapWords <= 0) return '';
  const words = chunk.split(/\s+/);
  let tail = words.slice(-overlapWords).join(' ');
  if (!tail || tail.length >= chunk.length) return '';
  if (typeof maxOverlapChars === 'number' && maxOverlapChars > 0 && tail.length > maxOverlapChars) {
    const tailWords = tail.split(/\s+/);
    while (tailWords.length > 0 && tail.length > maxOverlapChars) {
      tailWords.shift();
      tail = tailWords.join(' ');
    }
  }
  return tail;
}

function getValidOverlap(tail, unitLength, chunkSize) {
  if (!tail) return '';
  if (tail.length + 1 + unitLength <= chunkSize) return tail;
  const words = tail.split(/\s+/);
  while (words.length > 0) {
    words.shift();
    const candidate = words.join(' ');
    if (candidate && candidate.length + 1 + unitLength <= chunkSize) {
      return candidate;
    }
  }
  return '';
}

// Chunks never cross a page boundary, so every chunk carries the page it actually came from.
// Returns { chunks, skippedPages } where skippedPages lists page numbers that yielded no text
// (e.g. scanned-image pages in a mixed PDF).
export function splitPagesIntoChunks(pages, chunkSize = 1000, overlap = 200) {
  const chunks = [];
  const skippedPages = [];
  const overlapWords = overlap > 0 ? Math.max(1, Math.floor(overlap / 6)) : 0;

  for (const page of pages) {
    const text = cleanText(page.text);
    if (!text) {
      skippedPages.push(page.pageNumber);
      continue;
    }

    const units = splitIntoSentences(text).flatMap((s) => (s.length > chunkSize ? splitLongSentence(s, chunkSize) : [s]));
    let current = '';

    for (const unit of units) {
      if (current && current.length + unit.length + 1 > chunkSize) {
        chunks.push({ text: current.trim(), pageNumber: page.pageNumber, chunkIndex: chunks.length });
        const tail = overlapTail(current.trim(), overlapWords, overlap);
        current = getValidOverlap(tail, unit.length, chunkSize);
      }
      current += (current ? ' ' : '') + unit;
    }

    if (current.trim()) {
      chunks.push({ text: current.trim(), pageNumber: page.pageNumber, chunkIndex: chunks.length });
    }
  }

  return { chunks, skippedPages };
}

export async function processPDFToChunks(buffer, chunkSize = 1000, overlap = 200) {
  try {
    if (DEBUG) console.log('🔄 Processing PDF to chunks...');
    if (!buffer || buffer.length === 0) throw new Error('Invalid PDF buffer provided');

    const pages = await extractPagesFromPDF(buffer);
    const { chunks, skippedPages } = splitPagesIntoChunks(pages, chunkSize, overlap);

    if (chunks.length === 0) throw new Error('No text content found in PDF');

    if (skippedPages.length > 0) {
      console.warn(`⚠️  ${skippedPages.length} page(s) yielded no text (likely scanned images): pages ${skippedPages.join(', ')}`);
    }

    if (DEBUG) console.log(`✅ Created ${chunks.length} chunk(s) across ${new Set(chunks.map((c) => c.pageNumber)).size} page(s)`);

    return { chunks, totalPages: pages.length, skippedPages };
  } catch (error) {
    if (DEBUG) console.error('❌ Processing error:', error);
    if (error.message?.includes('Invalid PDF')) throw new Error('The uploaded file is not a valid PDF document');
    if (error.name === 'PasswordException' || /password/i.test(error.message)) {
      throw new Error('This PDF is password protected and cannot be processed');
    }
    throw error;
  }
}

export function generateChunkId(userId, fileName, chunkIndex) {
  const sanitized = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `${userId}-${sanitized}-${chunkIndex}`;
}

export function validatePDFBuffer(buffer) {
  if (!buffer || buffer.length === 0) return { isValid: false, error: 'Empty or invalid buffer' };
  if (buffer.length < 100) return { isValid: false, error: 'File too small to be a valid PDF' };
  const header = buffer.toString('ascii', 0, 4);
  if (header !== '%PDF') return { isValid: false, error: 'Invalid PDF file format' };
  return { isValid: true };
}

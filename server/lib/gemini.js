import { GoogleGenerativeAI } from '@google/generative-ai';

// gemini-3.8-flash can accept generateContent requests without ever responding.
// Models from different families have independent rate-limit pools on the free tier,
// so spreading across families maximises availability under quota pressure.
const modelNames = [
  'gemini-3.8-flash',        // Current highest priority
  'gemini-3.6-flash',        // Current fallback
  'gemini-3-flash-preview',  // Keep as preview fallback
  'gemini-3.5-flash-lite',   // Keep as lightweight fallback
];
const REQUEST_TIMEOUT_MS = 30000;
let genAI;

function getGenAI() {
  if (!process.env.GOOGLE_API_KEY) {
    throw new Error('Missing Google API key');
  }
  if (!genAI) {
    genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
  }
  return genAI;
}

async function retryWithBackoff(fn, maxRetries = 2, baseDelay = 2000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const isLast = attempt === maxRetries;
      const aborted = error?.name === 'GoogleGenerativeAIAbortError';
      const retryable = error?.status === 503 || error?.status === 429 || error?.message?.includes('overloaded');
      // Fail over immediately when an endpoint times out instead of retrying it.
      // For 429 rate limits, fail over to the next model quickly — a different
      // model family usually has an independent quota pool.
      const rateLimited = error?.status === 429;
      if (isLast || aborted || !retryable || rateLimited) throw error;
      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error('Max retries exceeded');
}

async function generateWithFallback(operation) {
  let lastError = null;
  for (const modelName of modelNames) {
    try {
      const model = getGenAI().getGenerativeModel({ model: modelName });
      console.log(`Trying model: ${modelName}`);
      return await retryWithBackoff(() => operation(model));
    } catch (err) {
      console.log(`Model ${modelName} failed:`, err.message);
      lastError = err;
    }
  }
  throw lastError || new Error('All models failed');
}

export async function generateResponse(question, context) {
  try {
    const contextText = context.join('\n\n');
    const prompt = `Answer the user's question using only the supplied document context.
For factual questions, state only facts supported by the context.
For analytical questions asking for a summary, recommendation, classification, suitability, or likely fit, make reasonable inferences from the available evidence and clearly present them as analysis rather than explicit document claims.
If formal work experience is not listed, say that directly but mention relevant projects or activities when useful.
If the context is insufficient, explain what information is missing.
Avoid generic lead-ins such as "Based on the provided context". Respond concisely in Markdown.

Context:
${contextText}

Question: ${question}

Answer:`;
    const result = await generateWithFallback((m) => m.generateContent(prompt, { timeout: REQUEST_TIMEOUT_MS }));
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error generating response:', error);
    if (error.name === 'GoogleGenerativeAIAbortError') {
      throw new Error('The AI service timed out. Please try again in a few moments.');
    } else if (error.message?.includes('overloaded') || error.message?.includes('503')) {
      throw new Error('The AI service is currently overloaded. Please try again in a few moments.');
    } else if (error.message?.includes('429')) {
      throw new Error('Rate limit exceeded. Please wait a moment before trying again.');
    }
    throw new Error('Failed to generate response');
  }
}

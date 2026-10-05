import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });
const modelNames = ['gemini-2.0-flash', 'gemini-2.5-pro', 'gemini-2.5-flash'];

async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const isLast = attempt === maxRetries;
      const retryable = error?.status === 503 || error?.status === 429 || error?.message?.includes('overloaded');
      if (isLast || !retryable) throw error;
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
      const model = genAI.getGenerativeModel({ model: modelName });
      console.log(`Trying model: ${modelName}`);
      return await retryWithBackoff(() => operation(model));
    } catch (err) {
      console.log(`Model ${modelName} failed:`, err.message);
      lastError = err;
    }
  }
  throw lastError || new Error('All models failed');
}

export async function generateEmbedding(text) {
  try {
    const result = await embeddingModel.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    console.error('Error generating single embedding:', error);
    throw error;
  }
}

export async function generateEmbeddings(texts) {
  try {
    const embeddings = [];
    const batchSize = 5;
    
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      console.log(`Processing embedding batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(texts.length / batchSize)}...`);
      
      const batchResults = await Promise.all(
        batch.map((text) => generateEmbedding(text))
      );
      
      embeddings.push(...batchResults);
      
      if (i + batchSize < texts.length) {
        await new Promise((resolve) => setTimeout(resolve, 500)); 
      }
    }
    
    return embeddings;
  } catch (error) {
    console.error('Error generating embeddings:', error);
    throw new Error(`Failed to generate embeddings: ${error.message}`);
  }
}

export async function generateResponse(question, context) {
  try {
    const contextText = context.join('\n\n');
    const prompt = `Based on the following context from PDF documents, answer the user's question.
If the answer cannot be found in the context, say so clearly.

Context:
${contextText}

Question: ${question}

Answer:`;
    const result = await generateWithFallback((m) => m.generateContent(prompt));
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error generating response:', error);
    if (error.message?.includes('overloaded') || error.message?.includes('503')) {
      throw new Error('The AI service is currently overloaded. Please try again in a few moments.');
    } else if (error.message?.includes('429')) {
      throw new Error('Rate limit exceeded. Please wait a moment before trying again.');
    }
    throw new Error('Failed to generate response');
  }
}

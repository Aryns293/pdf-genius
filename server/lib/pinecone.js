import { Pinecone } from '@pinecone-database/pinecone';

let pinecone;

function getPineconeClient() {
  if (!process.env.PINECONE_API_KEY) {
    throw new Error('Missing Pinecone API key');
  }
  if (!pinecone) {
    pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
  }
  return pinecone;
}

async function getIndex() {
  try {
    if (!process.env.PINECONE_INDEX_NAME) {
      throw new Error('Missing Pinecone index name');
    }
    return getPineconeClient().Index(process.env.PINECONE_INDEX_NAME);
  } catch (error) {
    console.error('Error getting Pinecone index:', error);
    throw new Error('Failed to get Pinecone index');
  }
}

export async function upsertVectors(chunks, embeddings) {
  try {
    const index = await getIndex();
    const vectors = chunks.map((chunk, i) => ({
      id: chunk.id,
      values: embeddings[i],
      metadata: {
        text: chunk.text,
        userId: chunk.metadata.userId,
        fileName: chunk.metadata.fileName,
        pageNumber: chunk.metadata.pageNumber,
        chunkIndex: chunk.metadata.chunkIndex,
        uploadedAt: chunk.metadata.uploadedAt,
      },
    }));
    const batchSize = 100;
    for (let i = 0; i < vectors.length; i += batchSize) {
      await index.upsert(vectors.slice(i, i + batchSize));
    }
  } catch (error) {
    console.error('Error upserting vectors:', error);
    throw new Error('Failed to upsert vectors to Pinecone');
  }
}

export async function queryVectors(queryEmbedding, userId, topK = 5) {
  try {
    const index = await getIndex();
    const response = await index.query({
      vector: queryEmbedding,
      topK,
      includeMetadata: true,
      filter: { userId: { $eq: userId } },
    });
    return (response.matches || []).map((m) => ({
      id: m.id,
      text: m.metadata?.text || '',
      score: m.score || 0,
      metadata: {
        userId: m.metadata?.userId || '',
        fileName: m.metadata?.fileName || '',
        pageNumber: m.metadata?.pageNumber || 0,
        chunkIndex: m.metadata?.chunkIndex || 0,
        uploadedAt: m.metadata?.uploadedAt || '',
      },
    }));
  } catch (error) {
    console.error('Error querying vectors:', error);
    throw new Error('Failed to query vectors from Pinecone');
  }
}

export async function deleteVectors(userId, fileName) {
  try {
    const index = await getIndex();
    const filter = { userId: { $eq: userId } };
    if (fileName) filter.fileName = { $eq: fileName };
    await index.deleteMany(filter);
  } catch (error) {
    console.error('Error deleting vectors:', error);
    throw new Error('Failed to delete vectors from Pinecone');
  }
}

export async function getAllUserFiles(userId) {
  try {
    const index = await getIndex();
    const response = await index.query({
      vector: new Array(768).fill(0),
      topK: 10000,
      includeMetadata: true,
      filter: { userId: { $eq: userId } },
    });
    const fileNames = new Set();
    let totalChunks = 0;
    (response.matches || []).forEach((m) => {
      if (m.metadata?.fileName) {
        fileNames.add(m.metadata.fileName);
        totalChunks++;
      }
    });
    return { files: Array.from(fileNames), totalChunks };
  } catch (error) {
    console.error('Error getting user files:', error);
    throw new Error('Failed to get user files from Pinecone');
  }
}

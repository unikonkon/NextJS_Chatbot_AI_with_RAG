import { GoogleGenerativeAI } from "@google/generative-ai";

const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || "text-embedding-004";

let genAI: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = process.env.GOOGLE_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "GOOGLE_API_KEY is not set in environment variables"
      );
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

/**
 * Embed a single text query using Google text-embedding-004
 */
export async function embedQuery(text: string): Promise<number[]> {
  const ai = getGenAI();
  const model = ai.getGenerativeModel({ model: EMBEDDING_MODEL });
  const result = await model.embedContent({
    content: { parts: [{ text }], role: "user" },
  });
  return result.embedding.values;
}

/**
 * Embed multiple texts in batches
 */
export async function embedBatch(texts: string[]): Promise<number[][]> {
  const ai = getGenAI();
  const model = ai.getGenerativeModel({ model: EMBEDDING_MODEL });
  const batchSize = 20;
  const allVectors: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const result = await model.batchEmbedContents({
      requests: batch.map((text) => ({
        content: { parts: [{ text }], role: "user" },
      })),
    });

    for (const embedding of result.embeddings) {
      allVectors.push(embedding.values);
    }

    // Small delay between batches to avoid rate limiting
    if (i + batchSize < texts.length) {
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  return allVectors;
}

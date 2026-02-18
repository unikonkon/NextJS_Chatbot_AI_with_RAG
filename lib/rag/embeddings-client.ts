"use client";

import { pipeline } from "@huggingface/transformers";
import { EMBEDDING_MODEL } from "@/lib/utils/constants";

let extractorPipeline: any = null;
let loadingPromise: Promise<any> | null = null;

async function getExtractor() {
  if (extractorPipeline) return extractorPipeline;

  if (loadingPromise) {
    await loadingPromise;
    return extractorPipeline;
  }

  loadingPromise = pipeline("feature-extraction", EMBEDDING_MODEL);

  try {
    extractorPipeline = await loadingPromise;
    console.log("Embedding model loaded successfully (client-side)");
    return extractorPipeline;
  } catch (error) {
    console.error("Failed to load embedding model:", error);
    throw error;
  } finally {
    loadingPromise = null;
  }
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const extractor = await getExtractor();
  const output = await extractor(text, {
    pooling: "mean",
    normalize: true,
  });
  const embedding = output.tolist();
  return Array.isArray(embedding[0]) ? embedding[0] : embedding;
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const vectors: number[][] = [];
  for (const text of texts) {
    vectors.push(await generateEmbedding(text));
  }
  return vectors;
}

export function isClientModelLoaded(): boolean {
  return extractorPipeline !== null;
}

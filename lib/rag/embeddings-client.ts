"use client";

import { pipeline } from "@huggingface/transformers";
import { EMBEDDING_MODEL } from "@/lib/utils/constants";

let extractorPipeline: any = null;
let loadingPromise: Promise<any> | null = null;

// Yield to the main thread so UI stays responsive
// 500ms delay gives the browser enough time to repaint between heavy WASM work
function yieldToUI(ms = 100): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function loadModel(): Promise<void> {
  if (extractorPipeline) return;
  if (loadingPromise) {
    await loadingPromise;
    return;
  }
  loadingPromise = pipeline("feature-extraction", EMBEDDING_MODEL);
  try {
    extractorPipeline = await loadingPromise;
    console.log("Embedding model loaded successfully (client-side)");
  } catch (error) {
    console.error("Failed to load embedding model:", error);
    throw error;
  } finally {
    loadingPromise = null;
  }
}

async function getExtractor() {
  if (!extractorPipeline) await loadModel();
  return extractorPipeline;
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

export interface EmbeddingProgress {
  current: number;
  total: number;
}

export async function generateEmbeddings(
  texts: string[],
  onProgress?: (progress: EmbeddingProgress) => void
): Promise<number[][]> {
  const vectors: number[][] = [];
  for (let i = 0; i < texts.length; i++) {
    vectors.push(await generateEmbedding(texts[i]));
    onProgress?.({ current: i + 1, total: texts.length });
    // Yield after every item with 500ms delay so the browser can repaint
    await yieldToUI();
  }
  return vectors;
}

export function isClientModelLoaded(): boolean {
  return extractorPipeline !== null;
}

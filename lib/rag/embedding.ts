import { pipeline, type FeatureExtractionPipeline } from "@huggingface/transformers";
import { EMBEDDING_MODEL } from "@/lib/utils/constants";

let embeddingPipeline: FeatureExtractionPipeline | null = null;
let isLoading = false;

export async function getEmbeddingPipeline(): Promise<FeatureExtractionPipeline> {
  if (embeddingPipeline) return embeddingPipeline;

  if (isLoading) {
    while (isLoading) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    if (embeddingPipeline) return embeddingPipeline;
  }

  isLoading = true;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    embeddingPipeline = (await (pipeline as any)("feature-extraction", EMBEDDING_MODEL, {
      dtype: "fp32",
    })) as FeatureExtractionPipeline;
    return embeddingPipeline;
  } finally {
    isLoading = false;
  }
}

export async function embedText(text: string): Promise<number[]> {
  const pipe = await getEmbeddingPipeline();
  const result = await pipe(text, { pooling: "mean", normalize: true });
  return Array.from(result.data as Float32Array);
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const pipe = await getEmbeddingPipeline();
  const vectors: number[][] = [];
  for (const text of texts) {
    const result = await pipe(text, { pooling: "mean", normalize: true });
    vectors.push(Array.from(result.data as Float32Array));
  }
  return vectors;
}

export function isModelLoaded(): boolean {
  return embeddingPipeline !== null;
}

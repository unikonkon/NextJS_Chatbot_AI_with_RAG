import { similarity } from "ml-distance";
import type { EmbeddedChunk } from "@/types/knowledge";
import type { RetrievalResult } from "@/types/rag";

export function cosineSimilarity(a: number[], b: number[]): number {
  return similarity.cosine(a, b);
}

export function retrieveTopK(
  queryVector: number[],
  embeddedChunks: EmbeddedChunk[],
  topK: number = 5,
  threshold: number = 0.3
): RetrievalResult[] {
  const results: RetrievalResult[] = embeddedChunks
    .map((chunk) => ({
      chunk,
      similarity: cosineSimilarity(queryVector, chunk.vector),
    }))
    .filter((r) => r.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);

  return results;
}

export function retrieveWithFilters(
  queryVector: number[],
  embeddedChunks: EmbeddedChunk[],
  topK: number = 5,
  threshold: number = 0.3,
  filters?: {
    category?: string;
    brand?: string;
    maxPrice?: number;
    minPrice?: number;
    minRating?: number;
  }
): RetrievalResult[] {
  let filtered = embeddedChunks;

  if (filters) {
    if (filters.category) {
      filtered = filtered.filter(
        (c) => c.metadata.category.toLowerCase() === filters.category!.toLowerCase()
      );
    }
    if (filters.brand) {
      filtered = filtered.filter(
        (c) => c.metadata.brand.toLowerCase() === filters.brand!.toLowerCase()
      );
    }
    if (filters.maxPrice !== undefined) {
      filtered = filtered.filter((c) => c.metadata.price <= filters.maxPrice!);
    }
    if (filters.minPrice !== undefined) {
      filtered = filtered.filter((c) => c.metadata.price >= filters.minPrice!);
    }
    if (filters.minRating !== undefined) {
      filtered = filtered.filter((c) => c.metadata.rating >= filters.minRating!);
    }
  }

  return retrieveTopK(queryVector, filtered, topK, threshold);
}

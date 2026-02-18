import type { Chunk, EmbeddedChunk } from "./knowledge";
import type { SourceReference } from "./chat";

export interface RetrievalResult {
  chunk: EmbeddedChunk;
  similarity: number;
}

export interface RAGResult {
  answer: string;
  sources: SourceReference[];
  retrievedChunks: RetrievalResult[];
  confidence: number;
}

export interface RAGOptions {
  topK: number;
  similarityThreshold: number;
  temperature: number;
  maxContextLength: number;
}

export interface EmbeddingResult {
  vector: number[];
  model: string;
  dimensions: number;
}

export interface PipelineStatus {
  embeddingModelLoaded: boolean;
  knowledgeBaseSize: number;
  embeddingsCount: number;
  modelName: string;
}

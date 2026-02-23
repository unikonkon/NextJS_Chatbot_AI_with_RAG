import { retrieveTopK } from "./retriever";
import { generateResponse, generateResponseStream } from "./generator";
import { embedQuery } from "./embedding-service";
import { buildAugmentedPrompt, type PromptContext } from "./prompt-template";
import { getKnowledgeStore } from "@/lib/knowledge/knowledge-store";
import type { RAGResult, RAGOptions } from "@/types/rag";
import type { SourceReference } from "@/types/chat";
import {
  DEFAULT_TOP_K,
  DEFAULT_SIMILARITY_THRESHOLD,
  DEFAULT_TEMPERATURE,
  DEFAULT_MAX_CONTEXT_LENGTH,
  EMBEDDING_MODEL,
  EMBEDDING_DIMENSIONS,
} from "@/lib/utils/constants";

const defaultOptions: RAGOptions = {
  topK: DEFAULT_TOP_K,
  similarityThreshold: DEFAULT_SIMILARITY_THRESHOLD,
  temperature: DEFAULT_TEMPERATURE,
  maxContextLength: DEFAULT_MAX_CONTEXT_LENGTH,
};

export async function runRAGPipeline(
  question: string,
  options: Partial<RAGOptions> = {}
): Promise<RAGResult> {
  const opts = { ...defaultOptions, ...options };

  const store = getKnowledgeStore();
  const embeddedChunks = store.getEmbeddedChunks();

  if (embeddedChunks.length === 0) {
    return {
      answer: "ยังไม่มีข้อมูลใน Knowledge Base กรุณาโหลดข้อมูลก่อน",
      sources: [],
      retrievedChunks: [],
      confidence: 0,
    };
  }

  // Step 1: Embed query server-side
  const queryVector = await embedQuery(question);

  // Step 2: Retrieve relevant chunks
  const retrievalResults = retrieveTopK(
    queryVector,
    embeddedChunks,
    opts.topK,
    opts.similarityThreshold
  );

  if (retrievalResults.length === 0) {
    return {
      answer: "ไม่พบสินค้าที่เกี่ยวข้องกับคำถามของคุณ กรุณาลองถามใหม่ด้วยคำอื่น",
      sources: [],
      retrievedChunks: [],
      confidence: 0,
    };
  }

  // Step 3: Build augmented prompt
  const products = store.getProducts();
  const promptCtx: PromptContext = {
    productsCount: products.length,
    categories: [...new Set(products.map((p) => p.category))],
  };
  const prompt = buildAugmentedPrompt(question, retrievalResults, promptCtx);

  // Step 4: Generate response
  const answer = await generateResponse(prompt, opts.temperature);

  // Step 5: Build sources
  const sources: SourceReference[] = retrievalResults.map((r, i) => ({
    productId: r.chunk.metadata.productId,
    productName: r.chunk.metadata.productName,
    similarity: r.similarity,
    category: r.chunk.metadata.category,
    price: r.chunk.metadata.price,
    rank: i + 1,
    matchedChunkText: r.chunk.text,
    embeddingModel: EMBEDDING_MODEL,
    similarityThreshold: opts.similarityThreshold,
    totalCandidates: embeddedChunks.length,
    dimensions: EMBEDDING_DIMENSIONS,
  }));

  const confidence =
    retrievalResults.reduce((sum, r) => sum + r.similarity, 0) /
    retrievalResults.length;

  return {
    answer,
    sources,
    retrievedChunks: retrievalResults,
    confidence,
  };
}

export async function* runRAGPipelineStream(
  question: string,
  options: Partial<RAGOptions> = {}
): AsyncGenerator<{ type: "text" | "sources" | "done"; data: string }> {
  const opts = { ...defaultOptions, ...options };

  const store = getKnowledgeStore();
  const embeddedChunks = store.getEmbeddedChunks();

  if (embeddedChunks.length === 0) {
    yield {
      type: "text",
      data: "ยังไม่มีข้อมูลใน Knowledge Base กรุณาโหลดข้อมูลก่อน",
    };
    yield { type: "done", data: "" };
    return;
  }

  // Step 1: Embed query server-side
  const queryVector = await embedQuery(question);

  // Step 2: Retrieve
  const retrievalResults = retrieveTopK(
    queryVector,
    embeddedChunks,
    opts.topK,
    opts.similarityThreshold
  );

  if (retrievalResults.length === 0) {
    yield {
      type: "text",
      data: "ไม่พบสินค้าที่เกี่ยวข้องกับคำถามของคุณ กรุณาลองถามใหม่ด้วยคำอื่น",
    };
    yield { type: "done", data: "" };
    return;
  }

  // Step 3: Build prompt
  const products = store.getProducts();
  const promptCtx: PromptContext = {
    productsCount: products.length,
    categories: [...new Set(products.map((p) => p.category))],
  };
  const prompt = buildAugmentedPrompt(question, retrievalResults, promptCtx);

  // Yield sources
  const sources: SourceReference[] = retrievalResults.map((r, i) => ({
    productId: r.chunk.metadata.productId,
    productName: r.chunk.metadata.productName,
    similarity: r.similarity,
    category: r.chunk.metadata.category,
    price: r.chunk.metadata.price,
    rank: i + 1,
    matchedChunkText: r.chunk.text,
    embeddingModel: EMBEDDING_MODEL,
    similarityThreshold: opts.similarityThreshold,
    totalCandidates: embeddedChunks.length,
    dimensions: EMBEDDING_DIMENSIONS,
  }));

  yield { type: "sources", data: JSON.stringify(sources) };

  // Step 4: Generate + stream
  for await (const text of generateResponseStream(prompt, opts.temperature)) {
    yield { type: "text", data: text };
  }

  yield { type: "done", data: "" };
}

import type { Product, Chunk, EmbeddedChunk, KnowledgeBase } from "@/types/knowledge";
import { productsToChunks } from "@/lib/rag/chunker";
import { embedTexts } from "@/lib/rag/embedding";

class KnowledgeStore {
  private products: Product[] = [];
  private chunks: Chunk[] = [];
  private embeddedChunks: EmbeddedChunk[] = [];
  private isInitialized = false;
  private isEmbedding = false;

  async loadFromKnowledgeBase(kb: KnowledgeBase): Promise<void> {
    this.products = kb.products;
    this.chunks = productsToChunks(kb.products);
    this.isInitialized = true;
  }

  async embedAllChunks(): Promise<void> {
    if (this.chunks.length === 0) {
      throw new Error("No chunks to embed. Load knowledge base first.");
    }

    if (this.isEmbedding) {
      throw new Error("Embedding is already in progress.");
    }

    this.isEmbedding = true;
    try {
      const texts = this.chunks.map((c) => c.text);
      const vectors = await embedTexts(texts);

      this.embeddedChunks = this.chunks.map((chunk, i) => ({
        ...chunk,
        vector: vectors[i],
      }));
    } finally {
      this.isEmbedding = false;
    }
  }

  getProducts(): Product[] {
    return this.products;
  }

  getChunks(): Chunk[] {
    return this.chunks;
  }

  getEmbeddedChunks(): EmbeddedChunk[] {
    return this.embeddedChunks;
  }

  getProductById(id: string): Product | undefined {
    return this.products.find((p) => p.id === id);
  }

  getStatus() {
    return {
      isInitialized: this.isInitialized,
      isEmbedding: this.isEmbedding,
      productsCount: this.products.length,
      chunksCount: this.chunks.length,
      embeddingsCount: this.embeddedChunks.length,
    };
  }

  hasEmbeddings(): boolean {
    return this.embeddedChunks.length > 0;
  }
}

// Singleton instance
let store: KnowledgeStore | null = null;

export function getKnowledgeStore(): KnowledgeStore {
  if (!store) {
    store = new KnowledgeStore();
  }
  return store;
}

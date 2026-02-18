import type { Product, Chunk, EmbeddedChunk, KnowledgeBase } from "@/types/knowledge";
import { productsToChunks } from "@/lib/rag/chunker";
import { embedTexts } from "@/lib/rag/embedding";
import { MAX_PRODUCTS } from "@/lib/utils/constants";

class KnowledgeStore {
  private products: Product[] = [];
  private chunks: Chunk[] = [];
  private embeddedChunks: EmbeddedChunk[] = [];
  private isInitialized = false;
  private isEmbedding = false;
  private baseProductsCount = 0;
  private customProductsCount = 0;

  async loadFromKnowledgeBase(kb: KnowledgeBase): Promise<void> {
    this.products = kb.products;
    this.chunks = productsToChunks(kb.products);
    this.baseProductsCount = kb.products.length;
    this.customProductsCount = 0;
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

  async appendProducts(
    newProducts: Product[]
  ): Promise<{ added: number; skipped: number }> {
    if (!this.isInitialized) {
      throw new Error("Knowledge base not initialized. Call loadFromKnowledgeBase first.");
    }

    if (this.isEmbedding) {
      throw new Error("Embedding is in progress. Please wait.");
    }

    const existingIds = new Set(this.products.map((p) => p.id));
    const uniqueProducts = newProducts.filter((p) => !existingIds.has(p.id));
    const skipped = newProducts.length - uniqueProducts.length;

    const available = MAX_PRODUCTS - this.products.length;
    const toAdd = uniqueProducts.slice(0, available);

    if (toAdd.length === 0) {
      return { added: 0, skipped: skipped + uniqueProducts.length - toAdd.length };
    }

    this.isEmbedding = true;
    try {
      const newChunks = productsToChunks(toAdd);
      const texts = newChunks.map((c) => c.text);
      const vectors = await embedTexts(texts);

      const newEmbeddedChunks = newChunks.map((chunk, i) => ({
        ...chunk,
        vector: vectors[i],
      }));

      this.products = [...this.products, ...toAdd];
      this.chunks = [...this.chunks, ...newChunks];
      this.embeddedChunks = [...this.embeddedChunks, ...newEmbeddedChunks];
      this.customProductsCount += toAdd.length;
    } finally {
      this.isEmbedding = false;
    }

    return {
      added: toAdd.length,
      skipped: skipped + (uniqueProducts.length - toAdd.length),
    };
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
      baseProductsCount: this.baseProductsCount,
      customProductsCount: this.customProductsCount,
      maxProducts: MAX_PRODUCTS,
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

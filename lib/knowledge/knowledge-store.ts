import { readFile } from "fs/promises";
import { join } from "path";
import type { Product, Chunk, EmbeddedChunk } from "@/types/knowledge";
import { productsToChunks } from "@/lib/rag/chunker";
import { MAX_PRODUCTS } from "@/lib/utils/constants";

interface EmbeddedProduct {
  text: string;
  metadata: {
    productId: string;
    productName: string;
    category: string;
    brand: string;
    price: number;
  };
  vector: number[];
}

class KnowledgeStore {
  private products: Product[] = [];
  private chunks: Chunk[] = [];
  private embeddedChunks: EmbeddedChunk[] = [];
  private isInitialized = false;
  private baseProductsCount = 0;
  private customProductsCount = 0;

  /**
   * Load products from KB file + pre-computed embeddings from embeddings.json
   */
  async initializeFromPrecomputed(kbProducts: Product[]): Promise<void> {
    // Read pre-computed embeddings
    const embeddingsPath = join(process.cwd(), "public", "data", "embeddings.json");
    const raw = await readFile(embeddingsPath, "utf-8");
    const embeddedProducts: EmbeddedProduct[] = JSON.parse(raw);

    // Build chunks + embedded chunks from pre-computed data
    this.products = kbProducts;
    this.chunks = productsToChunks(kbProducts);

    // Map pre-computed embeddings to EmbeddedChunk format
    this.embeddedChunks = embeddedProducts.map((ep) => {
      const chunk = this.chunks.find(
        (c) => c.metadata.productId === ep.metadata.productId
      );

      if (chunk) {
        return { ...chunk, vector: ep.vector };
      }

      // Fallback: create chunk from embedded product data
      return {
        id: `chunk-${ep.metadata.productId}`,
        productId: ep.metadata.productId,
        text: ep.text,
        metadata: {
          productId: ep.metadata.productId,
          productName: ep.metadata.productName,
          category: ep.metadata.category,
          brand: ep.metadata.brand,
          price: ep.metadata.price,
          originalPrice: 0,
          discount: null,
          rating: 0,
          soldCount: 0,
          isMall: false,
          freeShipping: false,
        },
        vector: ep.vector,
      };
    });

    this.baseProductsCount = kbProducts.length;
    this.customProductsCount = 0;
    this.isInitialized = true;
  }

  async appendProducts(
    newProducts: Product[],
    vectors: number[][]
  ): Promise<{ added: number; skipped: number }> {
    if (!this.isInitialized) {
      throw new Error("Knowledge base not initialized.");
    }

    const existingIds = new Set(this.products.map((p) => p.id));
    const uniqueProducts = newProducts.filter((p) => !existingIds.has(p.id));
    const skipped = newProducts.length - uniqueProducts.length;

    const available = MAX_PRODUCTS - this.products.length;
    const toAdd = uniqueProducts.slice(0, available);

    if (toAdd.length === 0) {
      return { added: 0, skipped: skipped + uniqueProducts.length - toAdd.length };
    }

    const newChunks = productsToChunks(toAdd);

    if (vectors.length !== newChunks.length) {
      throw new Error(
        `Vectors count (${vectors.length}) must match new chunks count (${newChunks.length})`
      );
    }

    const newEmbeddedChunks = newChunks.map((chunk, i) => ({
      ...chunk,
      vector: vectors[i],
    }));

    this.products = [...this.products, ...toAdd];
    this.chunks = [...this.chunks, ...newChunks];
    this.embeddedChunks = [...this.embeddedChunks, ...newEmbeddedChunks];
    this.customProductsCount += toAdd.length;

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

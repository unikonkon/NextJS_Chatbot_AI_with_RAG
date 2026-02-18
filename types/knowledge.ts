export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  discount: string | null;
  soldCount: number;
  rating: number;
  shopName: string;
  shopLocation: string;
  isMall: boolean;
  isPreferred: boolean;
  freeShipping: boolean;
  category: string;
  brand: string;
  tags: string[];
  specs: Record<string, string | number | boolean>;
  warranty: string;
  returnPolicy: string;
}

export interface KnowledgeBase {
  version: string;
  name: string;
  description: string;
  source: string;
  scrapedAt: string;
  totalProducts: number;
  categories: string[];
  products: Product[];
}

export interface Chunk {
  id: string;
  productId: string;
  text: string;
  metadata: ChunkMetadata;
}

export interface ChunkMetadata {
  productId: string;
  productName: string;
  category: string;
  brand: string;
  price: number;
  originalPrice: number;
  discount: string | null;
  rating: number;
  soldCount: number;
  isMall: boolean;
  freeShipping: boolean;
}

export interface EmbeddedChunk extends Chunk {
  vector: number[];
}

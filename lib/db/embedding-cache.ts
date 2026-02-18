"use client";

import {
  getCachedEmbedding,
  setCachedEmbedding,
  clearEmbeddingCache,
} from "./indexed-db";

export class ClientEmbeddingCache {
  private model: string;

  constructor(model: string) {
    this.model = model;
  }

  async get(text: string): Promise<number[] | null> {
    return getCachedEmbedding(text);
  }

  async set(text: string, vector: number[]): Promise<void> {
    return setCachedEmbedding(text, vector, this.model);
  }

  async clear(): Promise<void> {
    return clearEmbeddingCache();
  }
}

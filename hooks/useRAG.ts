"use client";

import { useState, useCallback } from "react";
import { generateEmbeddings } from "@/lib/rag/embeddings-client";
import { productsToChunks } from "@/lib/rag/chunker";
import { getAllCustomProducts } from "@/lib/db/custom-products";
import { MAX_PRODUCTS } from "@/lib/utils/constants";

interface RAGStatus {
  isReady: boolean;
  isInitializing: boolean;
  error: string | null;
  productsCount: number;
  embeddingsCount: number;
  baseProductsCount: number;
  customProductsCount: number;
  maxProducts: number;
}

export function useRAG() {
  const [status, setStatus] = useState<RAGStatus>({
    isReady: false,
    isInitializing: false,
    error: null,
    productsCount: 0,
    embeddingsCount: 0,
    baseProductsCount: 0,
    customProductsCount: 0,
    maxProducts: MAX_PRODUCTS,
  });

  const initialize = useCallback(async () => {
    if (status.isInitializing) return;

    setStatus((prev) => ({ ...prev, isInitializing: true, error: null }));

    try {
      // Step 1: Load KB on server (returns chunk texts)
      const loadRes = await fetch("/api/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "initialize" }),
      });

      if (!loadRes.ok) {
        const data = await loadRes.json();
        throw new Error(data.error || "Failed to load knowledge base");
      }

      const loadData = await loadRes.json();

      // Step 2: Embed chunk texts client-side
      const vectors = await generateEmbeddings(loadData.chunkTexts);

      // Step 3: Send vectors back to server
      const storeRes = await fetch("/api/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "store-vectors", vectors }),
      });

      if (!storeRes.ok) {
        const data = await storeRes.json();
        throw new Error(data.error || "Failed to store embeddings");
      }

      const storeData = await storeRes.json();

      setStatus({
        isReady: true,
        isInitializing: false,
        error: null,
        productsCount: storeData.productsCount,
        embeddingsCount: storeData.embeddingsCount,
        baseProductsCount: storeData.baseProductsCount ?? storeData.productsCount,
        customProductsCount: storeData.customProductsCount ?? 0,
        maxProducts: storeData.maxProducts ?? MAX_PRODUCTS,
      });

      // Step 4: Append custom products from IndexedDB
      try {
        const customProducts = await getAllCustomProducts();
        if (customProducts.length > 0) {
          const chunks = productsToChunks(customProducts);
          const customVectors = await generateEmbeddings(chunks.map((c) => c.text));

          const appendRes = await fetch("/api/knowledge", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "append",
              products: customProducts,
              vectors: customVectors,
            }),
          });

          if (appendRes.ok) {
            const appendData = await appendRes.json();
            setStatus((prev) => ({
              ...prev,
              productsCount: appendData.total,
              customProductsCount: appendData.customProductsCount,
              embeddingsCount: appendData.total,
            }));
          }
        }
      } catch {
        // silently fail — custom products will not load
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Initialization failed";
      setStatus((prev) => ({
        ...prev,
        isInitializing: false,
        error: msg,
      }));
    }
  }, [status.isInitializing]);

  const checkHealth = useCallback(async () => {
    try {
      const res = await fetch("/api/health");
      const data = await res.json();
      setStatus((prev) => ({
        ...prev,
        isReady: data.isReady,
        productsCount: data.knowledgeBaseSize,
        embeddingsCount: data.embeddingsCount,
      }));
      return data;
    } catch {
      return null;
    }
  }, []);

  return { status, initialize, checkHealth };
}

"use client";

import { useState, useCallback, useRef } from "react";
import {
  loadModel,
  generateEmbeddings,
} from "@/lib/rag/embeddings-client";
import { productsToChunks } from "@/lib/rag/chunker";
import { getAllCustomProducts } from "@/lib/db/custom-products";
import { MAX_PRODUCTS } from "@/lib/utils/constants";

export type InitStep =
  | "loading-kb"
  | "loading-model"
  | "embedding"
  | "storing"
  | "custom-products"
  | null;

interface RAGStatus {
  isReady: boolean;
  isInitializing: boolean;
  error: string | null;
  productsCount: number;
  embeddingsCount: number;
  baseProductsCount: number;
  customProductsCount: number;
  maxProducts: number;
  /** Current initialization step */
  step: InitStep;
  /** Embedding progress (e.g. 5/20) */
  embeddingProgress: { current: number; total: number } | null;
}

export function useRAG() {
  const initRef = useRef(false);

  const [status, setStatus] = useState<RAGStatus>({
    isReady: false,
    isInitializing: false,
    error: null,
    productsCount: 0,
    embeddingsCount: 0,
    baseProductsCount: 0,
    customProductsCount: 0,
    maxProducts: MAX_PRODUCTS,
    step: null,
    embeddingProgress: null,
  });

  const initialize = useCallback(async () => {
    // Prevent duplicate calls across renders
    if (initRef.current) return;
    initRef.current = true;

    setStatus((prev) => ({
      ...prev,
      isInitializing: true,
      error: null,
      step: "loading-kb",
      embeddingProgress: null,
    }));

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

      // Step 2: Load the embedding model (separate step so UI shows progress)
      setStatus((prev) => ({ ...prev, step: "loading-model" }));
      await loadModel();

      // Step 3: Embed chunk texts client-side
      setStatus((prev) => ({
        ...prev,
        step: "embedding",
        embeddingProgress: { current: 0, total: loadData.chunkTexts.length },
      }));

      const vectors = await generateEmbeddings(
        loadData.chunkTexts,
        (progress) => {
          setStatus((prev) => ({ ...prev, embeddingProgress: progress }));
        }
      );

      // Step 4: Send vectors back to server
      setStatus((prev) => ({ ...prev, step: "storing" }));

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
        step: null,
        embeddingProgress: null,
      });

      // Step 5: Append custom products from IndexedDB (non-blocking)
      try {
        const customProducts = await getAllCustomProducts();
        if (customProducts.length > 0) {
          setStatus((prev) => ({ ...prev, step: "custom-products" }));

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
              step: null,
            }));
          }
        }
      } catch {
        // silently fail — custom products will not load
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Initialization failed";
      initRef.current = false;
      setStatus((prev) => ({
        ...prev,
        isInitializing: false,
        error: msg,
        step: null,
        embeddingProgress: null,
      }));
    }
  }, []);

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

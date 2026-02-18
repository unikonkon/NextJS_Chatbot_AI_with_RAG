"use client";

import { useState, useCallback } from "react";
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
      // Initialize base KB
      const res = await fetch("/api/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "initialize" }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to initialize");
      }

      const data = await res.json();
      setStatus({
        isReady: true,
        isInitializing: false,
        error: null,
        productsCount: data.productsCount,
        embeddingsCount: data.embeddingsCount,
        baseProductsCount: data.baseProductsCount ?? data.productsCount,
        customProductsCount: data.customProductsCount ?? 0,
        maxProducts: data.maxProducts ?? MAX_PRODUCTS,
      });

      // After base init, load custom products from IDB
      try {
        const customProducts = await getAllCustomProducts();
        if (customProducts.length > 0) {
          const appendRes = await fetch("/api/knowledge", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "append", products: customProducts }),
          });

          if (appendRes.ok) {
            const appendData = await appendRes.json();
            setStatus((prev) => ({
              ...prev,
              productsCount: appendData.total,
              customProductsCount: appendData.customProductsCount,
              embeddingsCount: appendData.total, // each product = 1 embedding
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

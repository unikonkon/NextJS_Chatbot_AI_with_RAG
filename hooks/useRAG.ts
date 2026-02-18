"use client";

import { useState, useCallback } from "react";

interface RAGStatus {
  isReady: boolean;
  isInitializing: boolean;
  error: string | null;
  productsCount: number;
  embeddingsCount: number;
}

export function useRAG() {
  const [status, setStatus] = useState<RAGStatus>({
    isReady: false,
    isInitializing: false,
    error: null,
    productsCount: 0,
    embeddingsCount: 0,
  });

  const initialize = useCallback(async () => {
    if (status.isInitializing) return;

    setStatus((prev) => ({ ...prev, isInitializing: true, error: null }));

    try {
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
      });
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

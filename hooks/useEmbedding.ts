"use client";

import { useState, useCallback } from "react";

export function useEmbedding() {
  const [isEmbedding, setIsEmbedding] = useState(false);

  const embedText = useCallback(async (text: string): Promise<number[] | null> => {
    setIsEmbedding(true);
    try {
      const res = await fetch("/api/embed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.vector;
    } catch {
      return null;
    } finally {
      setIsEmbedding(false);
    }
  }, []);

  const embedTexts = useCallback(async (texts: string[]): Promise<number[][] | null> => {
    setIsEmbedding(true);
    try {
      const res = await fetch("/api/embed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texts }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.vectors;
    } catch {
      return null;
    } finally {
      setIsEmbedding(false);
    }
  }, []);

  return { isEmbedding, embedText, embedTexts };
}

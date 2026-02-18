"use client";

import { useState, useCallback } from "react";
import {
  generateEmbedding,
  generateEmbeddings,
} from "@/lib/rag/embeddings-client";

export function useEmbedding() {
  const [isEmbedding, setIsEmbedding] = useState(false);

  const embedText = useCallback(async (text: string): Promise<number[] | null> => {
    setIsEmbedding(true);
    try {
      return await generateEmbedding(text);
    } catch {
      return null;
    } finally {
      setIsEmbedding(false);
    }
  }, []);

  const embedTexts = useCallback(async (texts: string[]): Promise<number[][] | null> => {
    setIsEmbedding(true);
    try {
      return await generateEmbeddings(texts);
    } catch {
      return null;
    } finally {
      setIsEmbedding(false);
    }
  }, []);

  return { isEmbedding, embedText, embedTexts };
}

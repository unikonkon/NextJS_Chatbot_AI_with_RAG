"use client";

import { useState, useCallback } from "react";

interface KnowledgeStatus {
  isUploading: boolean;
  uploadProgress: string;
  error: string | null;
  productsCount: number;
}

export function useKnowledge() {
  const [status, setStatus] = useState<KnowledgeStatus>({
    isUploading: false,
    uploadProgress: "",
    error: null,
    productsCount: 0,
  });

  const uploadFile = useCallback(async (file: File) => {
    setStatus((prev) => ({
      ...prev,
      isUploading: true,
      uploadProgress: "Uploading...",
      error: null,
    }));

    try {
      const formData = new FormData();
      formData.append("file", file);

      setStatus((prev) => ({ ...prev, uploadProgress: "Validating & Embedding..." }));

      const res = await fetch("/api/knowledge/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      const data = await res.json();
      setStatus({
        isUploading: false,
        uploadProgress: "Complete!",
        error: null,
        productsCount: data.documentsCount,
      });
      return data;
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Upload failed";
      setStatus((prev) => ({
        ...prev,
        isUploading: false,
        uploadProgress: "",
        error: msg,
      }));
      return null;
    }
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/knowledge");
      const data = await res.json();
      setStatus((prev) => ({
        ...prev,
        productsCount: data.productsCount,
      }));
      return data;
    } catch {
      return null;
    }
  }, []);

  return { status, uploadFile, fetchStatus };
}

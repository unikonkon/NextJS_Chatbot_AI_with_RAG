"use client";

import { useState, useCallback, useEffect } from "react";
import { MAX_PRODUCTS } from "@/lib/utils/constants";
import {
  saveCustomProducts,
  getAllCustomProducts,
  clearCustomProducts as clearIDBCustomProducts,
} from "@/lib/db/custom-products";
import { KnowledgeBaseSchema, ProductSchema } from "@/lib/knowledge/schema-validator";
import type { Product } from "@/types/knowledge";
import { z } from "zod";

interface KnowledgeStatus {
  isUploading: boolean;
  uploadProgress: string;
  error: string | null;
  productsCount: number;
  baseProductsCount: number;
  customProductsCount: number;
  maxProducts: number;
}

export function useKnowledge() {
  const [status, setStatus] = useState<KnowledgeStatus>({
    isUploading: false,
    uploadProgress: "",
    error: null,
    productsCount: 0,
    baseProductsCount: 0,
    customProductsCount: 0,
    maxProducts: MAX_PRODUCTS,
  });

  // Auto-fetch status on mount so labels reflect server state
  useEffect(() => {
    fetch("/api/knowledge")
      .then((res) => res.json())
      .then((data) => {
        setStatus((prev) => ({
          ...prev,
          productsCount: data.productsCount ?? 0,
          baseProductsCount: data.baseProductsCount ?? 0,
          customProductsCount: data.customProductsCount ?? 0,
          maxProducts: data.maxProducts ?? MAX_PRODUCTS,
        }));
      })
      .catch(() => {});
  }, []);

  const appendToServer = useCallback(async (products: Product[]) => {
    const res = await fetch("/api/knowledge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "append", products }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Append failed");
    }

    return await res.json();
  }, []);

  const uploadFile = useCallback(
    async (file: File) => {
      setStatus((prev) => ({
        ...prev,
        isUploading: true,
        uploadProgress: "กำลังอ่านไฟล์...",
        error: null,
      }));

      try {
        const text = await file.text();
        let parsed: unknown;
        try {
          parsed = JSON.parse(text);
        } catch {
          throw new Error("ไฟล์ JSON ไม่ถูกต้อง");
        }

        // Try parsing as KnowledgeBase first, then as Product[]
        let products: Product[];
        const kbResult = KnowledgeBaseSchema.safeParse(parsed);
        if (kbResult.success) {
          products = kbResult.data.products as Product[];
        } else {
          const arrayResult = z.array(ProductSchema).safeParse(parsed);
          if (arrayResult.success) {
            products = arrayResult.data as Product[];
          } else {
            throw new Error(
              "รูปแบบ JSON ไม่ถูกต้อง — ต้องเป็น KnowledgeBase หรือ Product[]"
            );
          }
        }

        if (products.length === 0) {
          throw new Error("ไม่มีสินค้าในไฟล์");
        }

        // Check capacity
        const available = status.maxProducts - status.productsCount;
        if (available <= 0) {
          throw new Error(`ความจุเต็มแล้ว (${status.maxProducts} สินค้า)`);
        }

        setStatus((prev) => ({ ...prev, uploadProgress: "กำลังบันทึกลง IndexedDB..." }));
        await saveCustomProducts(products);

        setStatus((prev) => ({
          ...prev,
          uploadProgress: `กำลังฝัง Embeddings (${products.length} สินค้า)...`,
        }));
        const data = await appendToServer(products);

        setStatus((prev) => ({
          ...prev,
          isUploading: false,
          uploadProgress: "",
          error: null,
          productsCount: data.total,
          baseProductsCount: data.baseProductsCount,
          customProductsCount: data.customProductsCount,
        }));

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
    },
    [status.maxProducts, status.productsCount, appendToServer]
  );

  const loadCustomProducts = useCallback(async () => {
    try {
      const customProducts = await getAllCustomProducts();
      if (customProducts.length === 0) return;

      const data = await appendToServer(customProducts);
      setStatus((prev) => ({
        ...prev,
        productsCount: data.total,
        baseProductsCount: data.baseProductsCount,
        customProductsCount: data.customProductsCount,
      }));
    } catch {
      // silently fail — custom products will not be loaded
    }
  }, [appendToServer]);

  const clearCustomProducts = useCallback(async () => {
    await clearIDBCustomProducts();
    // Re-initialize base only
    try {
      const res = await fetch("/api/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "initialize" }),
      });
      if (res.ok) {
        const data = await res.json();
        setStatus((prev) => ({
          ...prev,
          productsCount: data.productsCount,
          baseProductsCount: data.baseProductsCount ?? data.productsCount,
          customProductsCount: 0,
        }));
      }
    } catch {
      // silently fail
    }
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/knowledge");
      const data = await res.json();
      setStatus((prev) => ({
        ...prev,
        productsCount: data.productsCount,
        baseProductsCount: data.baseProductsCount ?? 0,
        customProductsCount: data.customProductsCount ?? 0,
        maxProducts: data.maxProducts ?? MAX_PRODUCTS,
      }));
      return data;
    } catch {
      return null;
    }
  }, []);

  return {
    status,
    uploadFile,
    fetchStatus,
    loadCustomProducts,
    clearCustomProducts,
  };
}

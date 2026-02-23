"use client";

import { useState, useCallback, useEffect } from "react";
import { MAX_PRODUCTS } from "@/lib/utils/constants";
import {
  saveCustomProducts,
  getAllCustomProducts,
  removeCustomProduct as removeIDBCustomProduct,
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
  customProductIds: string[];
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
    customProductIds: [],
    maxProducts: MAX_PRODUCTS,
  });

  // Auto-fetch status on mount + re-sync custom products from IndexedDB if needed
  useEffect(() => {
    let cancelled = false;

    async function initAndSync() {
      try {
        const res = await fetch("/api/knowledge");
        const data = await res.json();
        if (cancelled) return;

        setStatus((prev) => ({
          ...prev,
          productsCount: data.productsCount ?? 0,
          baseProductsCount: data.baseProductsCount ?? 0,
          customProductsCount: data.customProductsCount ?? 0,
          customProductIds: data.customProductIds ?? [],
          maxProducts: data.maxProducts ?? MAX_PRODUCTS,
        }));

        // If server has no custom products, re-sync from IndexedDB (e.g. after cold start)
        if ((data.customProductsCount ?? 0) === 0) {
          const idbProducts = await getAllCustomProducts();
          if (idbProducts.length > 0 && !cancelled) {
            const syncRes = await fetch("/api/knowledge", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "append", products: idbProducts }),
            });
            if (syncRes.ok && !cancelled) {
              const syncData = await syncRes.json();
              setStatus((prev) => ({
                ...prev,
                productsCount: syncData.total ?? prev.productsCount,
                baseProductsCount: syncData.baseProductsCount ?? prev.baseProductsCount,
                customProductsCount: syncData.customProductsCount ?? prev.customProductsCount,
              }));
              // Fetch again to get updated customProductIds
              const res2 = await fetch("/api/knowledge");
              const data2 = await res2.json();
              if (!cancelled) {
                setStatus((prev) => ({
                  ...prev,
                  customProductIds: data2.customProductIds ?? [],
                }));
              }
            }
          }
        }
      } catch {
        // silently fail
      }
    }

    initAndSync();
    return () => { cancelled = true; };
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
          uploadProgress: `กำลัง Embed + เพิ่มสินค้า (${products.length} รายการ)...`,
        }));

        // Server-side embed via append API
        const res = await fetch("/api/knowledge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "append", products }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Append failed");
        }

        const data = await res.json();
        const newIds = products.map((p) => p.id);

        setStatus((prev) => ({
          ...prev,
          isUploading: false,
          uploadProgress: "",
          error: null,
          productsCount: data.total,
          baseProductsCount: data.baseProductsCount,
          customProductsCount: data.customProductsCount,
          customProductIds: [...new Set([...prev.customProductIds, ...newIds])],
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
    [status.maxProducts, status.productsCount]
  );

  const loadCustomProducts = useCallback(async () => {
    try {
      const customProducts = await getAllCustomProducts();
      if (customProducts.length === 0) return;

      // Server-side embed
      const res = await fetch("/api/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "append", products: customProducts }),
      });

      if (res.ok) {
        const data = await res.json();
        setStatus((prev) => ({
          ...prev,
          productsCount: data.total,
          baseProductsCount: data.baseProductsCount,
          customProductsCount: data.customProductsCount,
        }));
      }
    } catch {
      // silently fail
    }
  }, []);

  const clearCustomProducts = useCallback(async () => {
    await clearIDBCustomProducts();
    try {
      const res = await fetch("/api/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
      });

      if (res.ok) {
        const data = await res.json();
        setStatus((prev) => ({
          ...prev,
          productsCount: data.productsCount ?? prev.productsCount,
          baseProductsCount: data.baseProductsCount ?? prev.baseProductsCount,
          customProductsCount: 0,
          customProductIds: [],
        }));
      }
    } catch {
      // silently fail
    }
  }, []);

  const deleteCustomProduct = useCallback(async (id: string) => {
    // Remove from IndexedDB
    await removeIDBCustomProduct(id);
    // Remove from server
    try {
      const res = await fetch("/api/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove", productId: id }),
      });

      if (res.ok) {
        const data = await res.json();
        setStatus((prev) => ({
          ...prev,
          productsCount: data.productsCount ?? prev.productsCount,
          baseProductsCount: data.baseProductsCount ?? prev.baseProductsCount,
          customProductsCount: data.customProductsCount ?? prev.customProductsCount,
          customProductIds: prev.customProductIds.filter((pid) => pid !== id),
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
        customProductIds: data.customProductIds ?? [],
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
    deleteCustomProduct,
  };
}

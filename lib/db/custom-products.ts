"use client";

import { getDB } from "./indexed-db";
import type { Product } from "@/types/knowledge";

const STORE_NAME = "custom-products" as const;

export async function saveCustomProducts(products: Product[]): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    for (const product of products) {
      await tx.store.put(product, product.id);
    }
    await tx.done;
  } catch {
    // silently fail
  }
}

export async function getAllCustomProducts(): Promise<Product[]> {
  try {
    const db = await getDB();
    return await db.getAll(STORE_NAME);
  } catch {
    return [];
  }
}

export async function getCustomProductsCount(): Promise<number> {
  try {
    const db = await getDB();
    return await db.count(STORE_NAME);
  } catch {
    return 0;
  }
}

export async function removeCustomProduct(id: string): Promise<void> {
  try {
    const db = await getDB();
    await db.delete(STORE_NAME, id);
  } catch {
    // silently fail
  }
}

export async function clearCustomProducts(): Promise<void> {
  try {
    const db = await getDB();
    await db.clear(STORE_NAME);
  } catch {
    // silently fail
  }
}

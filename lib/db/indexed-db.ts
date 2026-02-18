"use client";

import { openDB, type IDBPDatabase } from "idb";
import type { Message } from "@/types/chat";

const DB_NAME = "rag-chatbot";
const DB_VERSION = 1;

export interface RAGDatabase {
  "embedding-cache": {
    key: string;
    value: {
      text: string;
      vector: number[];
      model: string;
      createdAt: number;
    };
  };
  "chat-history": {
    key: string;
    value: {
      id: string;
      title: string;
      messages: Message[];
      createdAt: number;
      updatedAt: number;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<RAGDatabase>> | null = null;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<RAGDatabase>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("embedding-cache")) {
          db.createObjectStore("embedding-cache");
        }
        if (!db.objectStoreNames.contains("chat-history")) {
          db.createObjectStore("chat-history");
        }
      },
    });
  }
  return dbPromise;
}

export async function getCachedEmbedding(
  text: string
): Promise<number[] | null> {
  try {
    const db = await getDB();
    const result = await db.get("embedding-cache", text);
    return result?.vector ?? null;
  } catch {
    return null;
  }
}

export async function setCachedEmbedding(
  text: string,
  vector: number[],
  model: string
): Promise<void> {
  try {
    const db = await getDB();
    await db.put(
      "embedding-cache",
      { text, vector, model, createdAt: Date.now() },
      text
    );
  } catch {
    // silently fail for cache
  }
}

export async function clearEmbeddingCache(): Promise<void> {
  try {
    const db = await getDB();
    await db.clear("embedding-cache");
  } catch {
    // silently fail
  }
}

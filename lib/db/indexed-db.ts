"use client";

import { openDB, type IDBPDatabase } from "idb";
import type { Message } from "@/types/chat";
import type { Product } from "@/types/knowledge";

const DB_NAME = "rag-chatbot";
const DB_VERSION = 3;

export interface RAGDatabase {
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
  "custom-products": {
    key: string;
    value: Product;
  };
}

let dbPromise: Promise<IDBPDatabase<RAGDatabase>> | null = null;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<RAGDatabase>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Remove embedding-cache store if it exists from old version
        if (db.objectStoreNames.contains("embedding-cache")) {
          db.deleteObjectStore("embedding-cache");
        }
        if (!db.objectStoreNames.contains("chat-history")) {
          db.createObjectStore("chat-history");
        }
        if (!db.objectStoreNames.contains("custom-products")) {
          db.createObjectStore("custom-products");
        }
      },
    });
  }
  return dbPromise;
}

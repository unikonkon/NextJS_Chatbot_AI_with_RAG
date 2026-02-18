"use client";

import { getDB } from "./indexed-db";
import type { Message } from "@/types/chat";

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export async function createConversation(
  id: string,
  title: string,
  messages: Message[]
): Promise<Conversation | null> {
  try {
    const db = await getDB();
    const conversation: Conversation = {
      id,
      title,
      messages,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await db.put("chat-history", conversation, id);
    return conversation;
  } catch {
    return null;
  }
}

export async function getConversation(
  id: string
): Promise<Conversation | null> {
  try {
    const db = await getDB();
    const result = await db.get("chat-history", id);
    return result ?? null;
  } catch {
    return null;
  }
}

export async function getAllConversations(): Promise<Conversation[]> {
  try {
    const db = await getDB();
    const all = await db.getAll("chat-history");
    // Sort by updatedAt descending (newest first)
    return all.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

export async function updateConversation(
  id: string,
  updates: Partial<Pick<Conversation, "title" | "messages">>
): Promise<Conversation | null> {
  try {
    const db = await getDB();
    const existing = await db.get("chat-history", id);
    if (!existing) return null;

    const updated: Conversation = {
      ...existing,
      ...updates,
      updatedAt: Date.now(),
    };
    await db.put("chat-history", updated, id);
    return updated;
  } catch {
    return null;
  }
}

export async function deleteConversation(id: string): Promise<boolean> {
  try {
    const db = await getDB();
    await db.delete("chat-history", id);
    return true;
  } catch {
    return false;
  }
}

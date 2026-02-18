"use client";

import { useState, useCallback, useEffect } from "react";
import type { Conversation } from "@/lib/db/chat-history";
import {
  getAllConversations,
  deleteConversation,
} from "@/lib/db/chat-history";

export function useChatHistory() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const refreshConversations = useCallback(async () => {
    const all = await getAllConversations();
    setConversations(all);
  }, []);

  // Load all conversations on mount
  useEffect(() => {
    refreshConversations();
  }, [refreshConversations]);

  const startNewConversation = useCallback(() => {
    setActiveId(null);
  }, []);

  const selectConversation = useCallback((id: string) => {
    setActiveId(id);
  }, []);

  const removeConversation = useCallback(
    async (id: string) => {
      const success = await deleteConversation(id);
      if (success) {
        setConversations((prev) => prev.filter((c) => c.id !== id));
        if (activeId === id) {
          setActiveId(null);
        }
      }
    },
    [activeId]
  );

  return {
    conversations,
    activeId,
    setActiveId,
    startNewConversation,
    selectConversation,
    removeConversation,
    refreshConversations,
  };
}

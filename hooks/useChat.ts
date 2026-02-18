"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { Message, ChatState, SourceReference } from "@/types/chat";
import { generateId } from "@/lib/utils/format";
import { generateEmbedding } from "@/lib/rag/embeddings-client";
import {
  createConversation,
  getConversation,
  updateConversation,
} from "@/lib/db/chat-history";

interface UseChatOptions {
  conversationId: string | null;
  onConversationCreated?: (id: string) => void;
  onMessagesUpdated?: () => void;
}

export function useChat(options?: UseChatOptions) {
  const [state, setState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    error: null,
  });

  const conversationId = options?.conversationId ?? null;
  const onConversationCreated = options?.onConversationCreated;
  const onMessagesUpdated = options?.onMessagesUpdated;

  // Track the pending conversation ID for new chats
  const pendingConvIdRef = useRef<string | null>(null);

  // Load messages when conversationId changes
  useEffect(() => {
    if (!conversationId) {
      setState({ messages: [], isLoading: false, error: null });
      pendingConvIdRef.current = null;
      return;
    }

    let cancelled = false;
    (async () => {
      const conv = await getConversation(conversationId);
      if (cancelled) return;
      if (conv) {
        setState({ messages: conv.messages, isLoading: false, error: null });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || state.isLoading) return;

      const userMessage: Message = {
        id: generateId(),
        role: "user",
        content,
        timestamp: Date.now(),
      };

      const assistantMessage: Message = {
        id: generateId(),
        role: "assistant",
        content: "",
        timestamp: Date.now(),
        isStreaming: true,
      };

      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, userMessage, assistantMessage],
        isLoading: true,
        error: null,
      }));

      try {
        // Embed query client-side before sending to API
        const queryVector = await generateEmbedding(content);

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: content,
            queryVector,
            stream: true,
          }),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let fullText = "";
        let sources: SourceReference[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value, { stream: true });
          const lines = text.split("\n");

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6);
            if (!jsonStr) continue;

            try {
              const chunk = JSON.parse(jsonStr);

              if (chunk.type === "sources") {
                sources = JSON.parse(chunk.data);
              } else if (chunk.type === "text") {
                fullText += chunk.data;
                setState((prev) => ({
                  ...prev,
                  messages: prev.messages.map((m) =>
                    m.id === assistantMessage.id
                      ? { ...m, content: fullText, sources, isStreaming: true }
                      : m
                  ),
                }));
              } else if (chunk.type === "error") {
                throw new Error(chunk.data);
              }
            } catch (e) {
              if (e instanceof SyntaxError) continue;
              throw e;
            }
          }
        }

        // Finalize message
        setState((prev) => {
          const finalMessages = prev.messages.map((m) =>
            m.id === assistantMessage.id
              ? { ...m, content: fullText, sources, isStreaming: false }
              : m
          );

          // Persist to IndexedDB
          const currentConvId = conversationId ?? pendingConvIdRef.current;
          if (currentConvId) {
            // Update existing conversation
            updateConversation(currentConvId, { messages: finalMessages }).then(
              () => onMessagesUpdated?.()
            );
          } else {
            // Create new conversation
            const newId = generateId();
            pendingConvIdRef.current = newId;
            const title =
              content.length > 50 ? content.slice(0, 50) + "..." : content;
            createConversation(newId, title, finalMessages).then(() =>
              onConversationCreated?.(newId)
            );
          }

          return {
            ...prev,
            messages: finalMessages,
            isLoading: false,
          };
        });
      } catch (error) {
        const errMsg =
          error instanceof Error
            ? error.message
            : "เกิดข้อผิดพลาด กรุณาลองใหม่";
        setState((prev) => ({
          ...prev,
          messages: prev.messages.map((m) =>
            m.id === assistantMessage.id
              ? {
                  ...m,
                  content: `เกิดข้อผิดพลาด: ${errMsg}`,
                  isStreaming: false,
                }
              : m
          ),
          isLoading: false,
          error: errMsg,
        }));
      }
    },
    [state.isLoading, conversationId, onConversationCreated, onMessagesUpdated]
  );

  const clearMessages = useCallback(() => {
    setState({ messages: [], isLoading: false, error: null });
    pendingConvIdRef.current = null;
  }, []);

  return {
    messages: state.messages,
    isLoading: state.isLoading,
    error: state.error,
    sendMessage,
    clearMessages,
  };
}

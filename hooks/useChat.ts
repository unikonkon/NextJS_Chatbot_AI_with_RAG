"use client";

import { useState, useCallback } from "react";
import type { Message, ChatState, SourceReference } from "@/types/chat";
import { generateId } from "@/lib/utils/format";

export function useChat() {
  const [state, setState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    error: null,
  });

  const addMessage = useCallback((role: Message["role"], content: string, sources?: SourceReference[]) => {
    const message: Message = {
      id: generateId(),
      role,
      content,
      timestamp: Date.now(),
      sources,
    };
    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, message],
    }));
    return message;
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || state.isLoading) return;

      // Add user message
      const userMessage: Message = {
        id: generateId(),
        role: "user",
        content,
        timestamp: Date.now(),
      };

      // Add placeholder assistant message for streaming
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
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: content,
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
        setState((prev) => ({
          ...prev,
          messages: prev.messages.map((m) =>
            m.id === assistantMessage.id
              ? { ...m, content: fullText, sources, isStreaming: false }
              : m
          ),
          isLoading: false,
        }));
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : "เกิดข้อผิดพลาด กรุณาลองใหม่";
        setState((prev) => ({
          ...prev,
          messages: prev.messages.map((m) =>
            m.id === assistantMessage.id
              ? { ...m, content: `เกิดข้อผิดพลาด: ${errMsg}`, isStreaming: false }
              : m
          ),
          isLoading: false,
          error: errMsg,
        }));
      }
    },
    [state.isLoading]
  );

  const clearMessages = useCallback(() => {
    setState({ messages: [], isLoading: false, error: null });
  }, []);

  return {
    messages: state.messages,
    isLoading: state.isLoading,
    error: state.error,
    sendMessage,
    addMessage,
    clearMessages,
  };
}

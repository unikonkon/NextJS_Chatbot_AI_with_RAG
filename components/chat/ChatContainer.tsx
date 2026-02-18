"use client";

import { useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { TypingIndicator } from "./TypingIndicator";
import { SuggestedQuestions } from "./SuggestedQuestions";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { useChat } from "@/hooks/useChat";
import { useRAG } from "@/hooks/useRAG";
import { useScrollToBottom } from "@/hooks/useScrollToBottom";
import { EmbeddingStatus } from "@/components/knowledge/EmbeddingStatus";

interface ChatContainerProps {
  conversationId: string | null;
  onConversationCreated?: (id: string) => void;
  onMessagesUpdated?: () => void;
}

export function ChatContainer({
  conversationId,
  onConversationCreated,
  onMessagesUpdated,
}: ChatContainerProps) {
  const { messages, isLoading, sendMessage } = useChat({
    conversationId,
    onConversationCreated,
    onMessagesUpdated,
  });
  const { status: ragStatus, initialize } = useRAG();
  const { ref: scrollRef } = useScrollToBottom<HTMLDivElement>([messages]);

  useEffect(() => {
    if (!ragStatus.isReady && !ragStatus.isInitializing) {
      initialize();
    }
  }, []);

  const showSuggestions = messages.length === 0 && ragStatus.isReady;

  return (
    <div className="flex flex-col h-full">
      {/* Status bar */}
      {!ragStatus.isReady && (
        <EmbeddingStatus
          isInitializing={ragStatus.isInitializing}
          error={ragStatus.error}
          productsCount={ragStatus.productsCount}
          embeddingsCount={ragStatus.embeddingsCount}
          onRetry={initialize}
        />
      )}

      {/* Messages area */}
      <ScrollArea
        ref={scrollRef}
        className="flex-1 px-4 py-6 space-y-4 overflow-y-auto"
      >
        {messages.length === 0 && ragStatus.isReady && (
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-4">
            <div className="text-center space-y-2">
              <div className="text-4xl">🛒</div>
              <h2 className="text-lg font-semibold text-white/90">
                Shopee AI Shopping Assistant
              </h2>
              <p className="text-sm text-white/50 max-w-md">
                ถามเกี่ยวกับสินค้ายอดนิยมจาก Shopee ได้เลย!
                ค้นหา เปรียบเทียบ แนะนำสินค้า ตามงบประมาณ
              </p>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        <AnimatePresence>
          {isLoading && messages[messages.length - 1]?.content === "" && (
            <TypingIndicator />
          )}
        </AnimatePresence>
      </ScrollArea>

      {/* Suggested questions */}
      {showSuggestions && (
        <div className="px-4 pb-2">
          <SuggestedQuestions onSelect={sendMessage} />
        </div>
      )}

      {/* Input area */}
      <div className="p-4 pt-2 mx-6">
        <ChatInput
          onSend={sendMessage}
          isLoading={isLoading}
          disabled={!ragStatus.isReady}
        />
      </div>
    </div>
  );
}

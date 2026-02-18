"use client";

import { ChatBubble } from "./ChatBubble";
import { SourceReference } from "./SourceReference";
import type { Message } from "@/types/chat";

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  return (
    <ChatBubble role={message.role as "user" | "assistant"} isStreaming={message.isStreaming}>
      <div className="whitespace-pre-wrap break-words">{message.content}</div>
      {message.sources && message.sources.length > 0 && (
        <SourceReference sources={message.sources} />
      )}
    </ChatBubble>
  );
}

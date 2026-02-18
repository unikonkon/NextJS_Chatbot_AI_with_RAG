"use client";

import { motion } from "framer-motion";
import { Bot, User } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface ChatBubbleProps {
  role: "user" | "assistant";
  children: React.ReactNode;
  isStreaming?: boolean;
}

export function ChatBubble({ role, children, isStreaming }: ChatBubbleProps) {
  const isUser = role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn("flex gap-3 max-w-[85%]", isUser ? "ml-auto flex-row-reverse" : "")}
    >
      <div
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
          isUser
            ? "bg-sky-500/15"
            : "bg-orange-500/10"
        )}
      >
        {isUser ? <User size={16} className="text-white/70" /> : <Bot size={16} className="text-white/70" />}
      </div>
      <div
        className={cn(
          "rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "bg-white/10 text-white rounded-tr-sm"
            : "bg-white/[0.05] text-white/90 border border-white/8 rounded-tl-sm",
          isStreaming && "animate-pulse-subtle"
        )}
      >
        {children}
      </div>
    </motion.div>
  );
}

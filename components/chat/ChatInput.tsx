"use client";

import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function ChatInput({ onSend, isLoading, disabled }: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isLoading || disabled) return;
    onSend(trimmed);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [input, isLoading, disabled, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto-resize
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative flex items-end gap-2 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-2"
    >
      <textarea
        ref={textareaRef}
        value={input}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder="พิมพ์คำถามของคุณ..."
        disabled={isLoading || disabled}
        rows={1}
        className={cn(
          "flex-1 resize-none bg-transparent text-sm text-white placeholder-white/30 outline-none px-3 py-2 max-h-[170px] pr-10",
          (isLoading || disabled) && "opacity-50"
        )}
      />
      <button
        onClick={handleSend}
        disabled={!input.trim() || isLoading || disabled}
        className={cn(
          "flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 cursor-pointer",
          input.trim() && !isLoading && !disabled
            ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-105 active:scale-95"
            : "bg-white/5 text-white/20"
        )}
      >
        {isLoading ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <Send size={18} />
        )}
      </button>
    </motion.div>
  );
}

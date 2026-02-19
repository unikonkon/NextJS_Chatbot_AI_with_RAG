"use client";

import { motion } from "framer-motion";
import { Lightbulb, ArrowRight } from "lucide-react";
import { ChatBubble } from "./ChatBubble";
import { SourceReference } from "./SourceReference";
import { SUGGESTED_QUESTIONS } from "@/lib/utils/constants";
import type { Message } from "@/types/chat";

const NO_RESULTS_TEXT =
  "ไม่พบสินค้าที่เกี่ยวข้องกับคำถามของคุณ กรุณาลองถามใหม่ด้วยคำอื่น";

interface ChatMessageProps {
  message: Message;
  onSendMessage?: (message: string) => void;
}

export function ChatMessage({ message, onSendMessage }: ChatMessageProps) {
  const isNoResults =
    message.role === "assistant" &&
    message.content === NO_RESULTS_TEXT &&
    (!message.sources || message.sources.length === 0);

  return (
    <ChatBubble
      role={message.role as "user" | "assistant"}
      isStreaming={message.isStreaming}
    >
      {/* ข้อความ message.content ที่ถูกแชทออกมา */}
      <div className="whitespace-pre-wrap wrap-break-word">
        {message.content}
      </div>

      {/* เป็นข้อความที่แสดงแหล่งข้อมูล (กดเพื่อดูรายละเอียด) */}
      {message.sources && message.sources.length > 0 && (
        <SourceReference sources={message.sources} />
      )}

      {/* Suggested questions เมื่อไม่พบสินค้า */}
      {isNoResults && onSendMessage && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="mt-3 pt-3 border-t border-white/10"
        >
          <p className="text-[10px] uppercase tracking-wider text-white/40 mb-2 flex items-center gap-1.5">
            <Lightbulb size={10} className="text-amber-400/60" />
            ลองถามแบบนี้ดูสิ
          </p>
          <div className="flex flex-col gap-1.5">
            {SUGGESTED_QUESTIONS.map((q, i) => (
              <motion.button
                key={q}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.06 * i + 0.3 }}
                whileHover={{ x: 3 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSendMessage(q)}
                className="group flex items-center gap-2 rounded-lg bg-white/3 border border-white/8 px-3 py-2 text-left hover:bg-white/8 hover:border-orange-500/20 transition-all duration-150 cursor-pointer"
              >
                <ArrowRight
                  size={10}
                  className="text-white/20 group-hover:text-orange-400 transition-colors shrink-0"
                />
                <span className="text-[11px] text-white/50 group-hover:text-white/80 transition-colors leading-snug">
                  {q}
                </span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}
    </ChatBubble>
  );
}

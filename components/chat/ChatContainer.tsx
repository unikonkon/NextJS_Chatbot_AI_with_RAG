"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

  // Defer initialization so the UI renders first (prevents blank/frozen screen)
  useEffect(() => {
    if (!ragStatus.isReady && !ragStatus.isInitializing) {
      const id = requestAnimationFrame(() => {
        initialize();
      });
      return () => cancelAnimationFrame(id);
    }
  }, []);

  const showSuggestions = messages.length === 0 && ragStatus.isReady;

  return (
    <div className="flex flex-col h-full md:mx-8 mx-1">
      {/* Status bar */}
      {!ragStatus.isReady && (
        <EmbeddingStatus
          isInitializing={ragStatus.isInitializing}
          error={ragStatus.error}
          productsCount={ragStatus.productsCount}
          embeddingsCount={ragStatus.embeddingsCount}
          step={ragStatus.step}
          embeddingProgress={ragStatus.embeddingProgress}
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
            <div className="text-center space-y-4">
              {/* Animated AI Chatbot SVG */}
              <div className="flex justify-center">
                <svg
                  width="500"
                  height="220"
                  viewBox="0 0 500 220"
                  fill="none"
                  className="w-full max-w-[500px]"
                >
                  {/* Glow filters */}
                  <defs>
                    <filter id="glow-orange" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="6" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                    <filter id="glow-soft" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                    <linearGradient id="grad-orange" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#f97316" />
                      <stop offset="100%" stopColor="#ef4444" />
                    </linearGradient>
                    <linearGradient id="grad-violet" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#6366f1" />
                    </linearGradient>
                    <linearGradient id="grad-emerald" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>

                  {/* Connection lines (data flowing to bot) */}
                  {/* Left data node line */}
                  <motion.line
                    x1="90" y1="70" x2="200" y2="110"
                    stroke="url(#grad-violet)" strokeWidth="1.5" strokeDasharray="6 4"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: [0.2, 0.6, 0.2] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <motion.line
                    x1="80" y1="150" x2="200" y2="120"
                    stroke="url(#grad-emerald)" strokeWidth="1.5" strokeDasharray="6 4"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: [0.2, 0.5, 0.2] }}
                    transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                  />
                  {/* Right data node line */}
                  <motion.line
                    x1="410" y1="65" x2="300" y2="108"
                    stroke="url(#grad-orange)" strokeWidth="1.5" strokeDasharray="6 4"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: [0.2, 0.6, 0.2] }}
                    transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  />
                  <motion.line
                    x1="420" y1="155" x2="300" y2="122"
                    stroke="url(#grad-violet)" strokeWidth="1.5" strokeDasharray="6 4"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: [0.2, 0.5, 0.2] }}
                    transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
                  />

                  {/* Left data nodes */}
                  {/* Database icon node */}
                  <motion.g
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    <motion.circle
                      cx="75" cy="65" r="22"
                      fill="rgba(139,92,246,0.08)" stroke="rgba(139,92,246,0.3)" strokeWidth="1"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    />
                    {/* DB icon */}
                    <ellipse cx="75" cy="58" rx="10" ry="4" fill="none" stroke="rgba(139,92,246,0.6)" strokeWidth="1.5" />
                    <path d="M65 58 v12 c0 2.2 4.5 4 10 4 s10-1.8 10-4 v-12" fill="none" stroke="rgba(139,92,246,0.6)" strokeWidth="1.5" />
                    <ellipse cx="75" cy="64" rx="10" ry="4" fill="none" stroke="rgba(139,92,246,0.3)" strokeWidth="1" />
                  </motion.g>

                  {/* Document node */}
                  <motion.g
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                  >
                    <motion.circle
                      cx="68" cy="150" r="20"
                      fill="rgba(16,185,129,0.08)" stroke="rgba(16,185,129,0.3)" strokeWidth="1"
                      animate={{ scale: [1, 1.06, 1] }}
                      transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                    />
                    {/* File icon */}
                    <rect x="58" y="140" width="14" height="18" rx="2" fill="none" stroke="rgba(16,185,129,0.6)" strokeWidth="1.5" />
                    <path d="M62 147 h6 M62 151 h4" stroke="rgba(16,185,129,0.4)" strokeWidth="1" />
                    <path d="M68 140 l4 4 h-4 z" fill="rgba(16,185,129,0.3)" stroke="rgba(16,185,129,0.6)" strokeWidth="1" />
                  </motion.g>

                  {/* Right data nodes */}
                  {/* Search/product node */}
                  <motion.g
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    <motion.circle
                      cx="420" cy="60" r="22"
                      fill="rgba(249,115,22,0.08)" stroke="rgba(249,115,22,0.3)" strokeWidth="1"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                    />
                    {/* Cart icon */}
                    <path d="M412 53 h3 l2 12 h10 l2-8 h-12" fill="none" stroke="rgba(249,115,22,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="419" cy="68" r="1.5" fill="rgba(249,115,22,0.6)" />
                    <circle cx="426" cy="68" r="1.5" fill="rgba(249,115,22,0.6)" />
                  </motion.g>

                  {/* Embedding/vector node */}
                  <motion.g
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                  >
                    <motion.circle
                      cx="430" cy="155" r="20"
                      fill="rgba(139,92,246,0.08)" stroke="rgba(139,92,246,0.3)" strokeWidth="1"
                      animate={{ scale: [1, 1.06, 1] }}
                      transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut", delay: 0.7 }}
                    />
                    {/* Vector/neural icon */}
                    <circle cx="425" cy="148" r="2.5" fill="rgba(139,92,246,0.5)" />
                    <circle cx="435" cy="148" r="2.5" fill="rgba(139,92,246,0.5)" />
                    <circle cx="430" cy="160" r="2.5" fill="rgba(139,92,246,0.5)" />
                    <line x1="425" y1="148" x2="435" y2="148" stroke="rgba(139,92,246,0.3)" strokeWidth="1" />
                    <line x1="425" y1="148" x2="430" y2="160" stroke="rgba(139,92,246,0.3)" strokeWidth="1" />
                    <line x1="435" y1="148" x2="430" y2="160" stroke="rgba(139,92,246,0.3)" strokeWidth="1" />
                  </motion.g>

                  {/* Central Bot */}
                  <motion.g
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, type: "spring", damping: 15 }}
                  >
                    {/* Outer pulse ring */}
                    <motion.circle
                      cx="250" cy="110" r="50"
                      fill="none" stroke="url(#grad-orange)" strokeWidth="1"
                      animate={{ r: [50, 58, 50], opacity: [0.3, 0.1, 0.3] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    />
                    {/* Bot body bg */}
                    <circle cx="250" cy="110" r="42" fill="rgba(249,115,22,0.06)" stroke="rgba(249,115,22,0.2)" strokeWidth="1.5" />

                    {/* Bot head */}
                    <rect x="228" y="88" width="44" height="32" rx="10" fill="rgba(249,115,22,0.12)" stroke="url(#grad-orange)" strokeWidth="1.5" filter="url(#glow-soft)" />

                    {/* Eyes */}
                    <motion.circle
                      cx="241" cy="102" r="4"
                      fill="url(#grad-orange)"
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <motion.circle
                      cx="259" cy="102" r="4"
                      fill="url(#grad-orange)"
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.15 }}
                    />

                    {/* Smile */}
                    <motion.path
                      d="M243 111 q7 5 14 0"
                      fill="none" stroke="rgba(249,115,22,0.5)" strokeWidth="1.5" strokeLinecap="round"
                      animate={{ d: ["M243 111 q7 5 14 0", "M243 112 q7 3 14 0", "M243 111 q7 5 14 0"] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    />

                    {/* Antenna */}
                    <line x1="250" y1="88" x2="250" y2="78" stroke="rgba(249,115,22,0.4)" strokeWidth="1.5" />
                    <motion.circle
                      cx="250" cy="75" r="3"
                      fill="url(#grad-orange)" filter="url(#glow-orange)"
                      animate={{ opacity: [0.5, 1, 0.5], r: [3, 4, 3] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />

                    {/* Chat bubble hint */}
                    <motion.g
                      animate={{ y: [0, -2, 0] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <rect x="262" y="126" width="28" height="14" rx="7" fill="rgba(249,115,22,0.1)" stroke="rgba(249,115,22,0.25)" strokeWidth="1" />
                      {/* Dots */}
                      <motion.circle
                        cx="271" cy="133" r="1.5" fill="rgba(249,115,22,0.5)"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                      />
                      <motion.circle
                        cx="276" cy="133" r="1.5" fill="rgba(249,115,22,0.5)"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                      />
                      <motion.circle
                        cx="281" cy="133" r="1.5" fill="rgba(249,115,22,0.5)"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                      />
                    </motion.g>
                  </motion.g>

                  {/* Floating data particles */}
                  {[
                    { cx: 150, cy: 80, delay: 0, color: "139,92,246" },
                    { cx: 170, cy: 145, delay: 0.8, color: "16,185,129" },
                    { cx: 340, cy: 85, delay: 0.4, color: "249,115,22" },
                    { cx: 350, cy: 150, delay: 1.2, color: "139,92,246" },
                    { cx: 130, cy: 115, delay: 1.5, color: "249,115,22" },
                    { cx: 370, cy: 120, delay: 0.6, color: "16,185,129" },
                  ].map((p, i) => (
                    <motion.circle
                      key={i}
                      cx={p.cx} cy={p.cy} r="2"
                      fill={`rgba(${p.color},0.6)`}
                      animate={{
                        cx: [p.cx, p.cx + (p.cx < 250 ? 15 : -15), p.cx],
                        cy: [p.cy, p.cy - 8, p.cy],
                        opacity: [0, 0.8, 0],
                      }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: p.delay }}
                    />
                  ))}
                </svg>
              </div>

              <h2 className="text-lg font-semibold text-white/80">
                สวัสดี, มีอะไรให้ช่วยไหม?
              </h2>
              <p className="text-sm text-white/40 max-w-sm mx-auto leading-relaxed">
                ถามเกี่ยวกับสินค้าได้เลย — ค้นหา เปรียบเทียบ แนะนำสินค้าตามงบประมาณ
              </p>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} onSendMessage={sendMessage} />
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
      <div className="p-4 pt-2 md:mx-20 mx-1">
        <ChatInput
          onSend={sendMessage}
          isLoading={isLoading}
          disabled={!ragStatus.isReady}
        />
      </div>
    </div>
  );
}

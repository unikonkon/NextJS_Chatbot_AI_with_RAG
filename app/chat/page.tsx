"use client";

import { useState, useCallback } from "react";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { ThreeBackground } from "@/components/layout/ThreeBackground";
import { ToastProvider } from "@/components/ui/Toast";
import { useRAG } from "@/hooks/useRAG";

export default function ChatPage() {
  const [showKnowledge, setShowKnowledge] = useState(false);
  const { status: ragStatus } = useRAG();

  const toggleKnowledge = useCallback(() => {
    setShowKnowledge((prev) => !prev);
  }, []);

  // clearChat will be handled inside ChatContainer via a ref or callback
  // For now, using a simple page reload approach
  const clearChat = useCallback(() => {
    window.location.reload();
  }, []);

  return (
    <ToastProvider>
      <div className="relative h-screen w-screen overflow-hidden">
        {/* Animated background */}
        <ThreeBackground />

        {/* Main content */}
        <div className="relative z-10 flex h-full">
          {/* Chat area */}
          <div className="flex-1 flex flex-col min-w-0">
            <Header
              onToggleKnowledge={toggleKnowledge}
              onClearChat={clearChat}
              isReady={ragStatus.isReady}
              productsCount={ragStatus.productsCount}
            />
            <div className="flex-1 min-h-0">
              <ChatContainer />
            </div>
          </div>

          {/* Knowledge sidebar */}
          <Sidebar isOpen={showKnowledge} onClose={() => setShowKnowledge(false)} />
        </div>
      </div>
    </ToastProvider>
  );
}

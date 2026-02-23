"use client";

import { useState, useCallback, useEffect } from "react";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { ChatSidebar } from "@/components/layout/ChatSidebar";
import { ThreeBackground } from "@/components/layout/ThreeBackground";
import { ToastProvider } from "@/components/ui/Toast";
import { useChatHistory } from "@/hooks/useChatHistory";
import { getAllCustomProducts } from "@/lib/db/custom-products";

export default function ChatPage() {
  const [showKnowledge, setShowKnowledge] = useState(false);
  const [showChatSidebar, setShowChatSidebar] = useState(true);
  const [healthData, setHealthData] = useState<{ isReady: boolean; productsCount: number }>({
    isReady: false,
    productsCount: 0,
  });

  // Fetch health status + re-sync custom products from IndexedDB on mount
  useEffect(() => {
    let cancelled = false;

    async function initAndSync() {
      try {
        // 1. Fetch health
        const healthRes = await fetch("/api/health");
        const health = await healthRes.json();
        if (cancelled) return;

        setHealthData({
          isReady: health.isReady ?? false,
          productsCount: health.knowledgeBaseSize ?? 0,
        });

        // 2. Re-sync custom products if server lost them (cold start)
        if ((health.customProductsCount ?? 0) === 0) {
          const idbProducts = await getAllCustomProducts();
          if (idbProducts.length > 0 && !cancelled) {
            const syncRes = await fetch("/api/knowledge", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "append", products: idbProducts }),
            });
            if (syncRes.ok && !cancelled) {
              const syncData = await syncRes.json();
              setHealthData((prev) => ({
                ...prev,
                productsCount: syncData.total ?? prev.productsCount,
              }));
            }
          }
        }
      } catch {
        // silently fail
      }
    }

    initAndSync();
    return () => { cancelled = true; };
  }, []);

  const {
    conversations,
    activeId,
    setActiveId,
    startNewConversation,
    selectConversation,
    removeConversation,
    refreshConversations,
  } = useChatHistory();

  const toggleKnowledge = useCallback(() => {
    setShowKnowledge((prev) => !prev);
  }, []);

  const toggleChatSidebar = useCallback(() => {
    setShowChatSidebar((prev) => !prev);
  }, []);

  const handleConversationCreated = useCallback(
    (id: string) => {
      setActiveId(id);
      refreshConversations();
    },
    [setActiveId, refreshConversations]
  );

  const handleMessagesUpdated = useCallback(() => {
    refreshConversations();
  }, [refreshConversations]);

  const clearChat = useCallback(() => {
    startNewConversation();
  }, [startNewConversation]);

  return (
    <ToastProvider>
      <div className="relative h-screen w-screen overflow-hidden">
        {/* Animated background */}
        <ThreeBackground />

        {/* Main content */}
        <div className="relative z-10 flex h-full">
          {/* Chat history sidebar */}
          <ChatSidebar
            isOpen={showChatSidebar}
            onClose={() => setShowChatSidebar(false)}
            conversations={conversations}
            activeId={activeId}
            onNewChat={startNewConversation}
            onSelect={selectConversation}
            onDelete={removeConversation}
          />

          {/* Chat area */}
          <div className="flex-1 flex flex-col min-w-0">
            <Header
              onToggleKnowledge={toggleKnowledge}
              onClearChat={clearChat}
              onToggleSidebar={toggleChatSidebar}
              isReady={healthData.isReady}
              productsCount={healthData.productsCount}
            />
            <div className="flex-1 min-h-0">
              <ChatContainer
                conversationId={activeId}
                onConversationCreated={handleConversationCreated}
                onMessagesUpdated={handleMessagesUpdated}
              />
            </div>
          </div>

          {/* Knowledge sidebar */}
          <Sidebar isOpen={showKnowledge} onClose={() => setShowKnowledge(false)} />
        </div>
      </div>
    </ToastProvider>
  );
}

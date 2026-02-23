"use client";

import { useState, useCallback } from "react";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { ChatSidebar } from "@/components/layout/ChatSidebar";
import { ThreeBackground } from "@/components/layout/ThreeBackground";
import { ToastProvider } from "@/components/ui/Toast";
import { useChatHistory } from "@/hooks/useChatHistory";

export default function ChatPage() {
  const [showKnowledge, setShowKnowledge] = useState(false);
  const [showChatSidebar, setShowChatSidebar] = useState(true);
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
              isReady={true}
              productsCount={0}
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

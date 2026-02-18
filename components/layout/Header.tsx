"use client";

import { motion } from "framer-motion";
import { Bot, Database, Trash2, Menu } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface HeaderProps {
  onToggleKnowledge: () => void;
  onClearChat: () => void;
  onToggleSidebar?: () => void;
  isReady: boolean;
  productsCount: number;
}

export function Header({
  onToggleKnowledge,
  onClearChat,
  onToggleSidebar,
  isReady,
  productsCount,
}: HeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/20 backdrop-blur-xl z-10"
    >
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <Button variant="ghost" size="icon" onClick={onToggleSidebar} className="h-9 w-9">
            <Menu size={18} />
          </Button>
        )}
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 shadow-lg shadow-orange-500/20">
          <Bot size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-sm font-semibold text-white/90 leading-tight">
            Shopee AI Assistant
          </h1>
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${isReady ? "bg-emerald-400" : "bg-amber-400 animate-pulse"}`} />
            <span className="text-[10px] text-white/40">
              {isReady ? `${productsCount} products` : "Initializing..."}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1">
        ข้อมูลสินค้า
        <Button variant="ghost" size="icon" onClick={onToggleKnowledge} title="Knowledge Base">
          <Database size={16} />
        </Button>
        ล้างข้อมูล
        <Button variant="ghost" size="icon" onClick={onClearChat} title="Clear Chat">
          <Trash2 size={16} />
        </Button>
      </div>
    </motion.header>
  );
}

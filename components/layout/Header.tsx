"use client";

import { motion } from "framer-motion";
import { Bot, Database, SquarePen, Menu } from "lucide-react";
import { Button } from "@/components/ui/Button";

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
      className="flex items-center justify-between px-2 sm:px-4 py-2 sm:py-3 border-b border-white/10 bg-black/20 backdrop-blur-xl z-10"
    >
      {/* Left: sidebar toggle + branding */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {onToggleSidebar && (
          <Button variant="ghost" size="icon" onClick={onToggleSidebar} className="h-8 w-8 sm:h-9 sm:w-9 shrink-0">
            <Menu size={18} />
          </Button>
        )}
        <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 shadow-lg shadow-orange-500/20 shrink-0">
          <Bot size={16} className="text-white sm:w-[18px] sm:h-[18px]" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xs sm:text-sm font-semibold text-white/90 leading-tight truncate">
            Shopee AI Assistant
          </h1>
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isReady ? "bg-emerald-400" : "bg-amber-400 animate-pulse"}`} />
            <span className="text-[10px] text-white/40 truncate">
              {isReady ? `${productsCount} products` : "Initializing..."}
            </span>
          </div>
        </div>
      </div>

      {/* Right: action buttons */}
      <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleKnowledge}
          title="Knowledge Base"
          className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3 sm:gap-1.5"
        >
          <Database size={16} />
          <span className="hidden sm:inline text-xs">ข้อมูลสินค้า</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClearChat}
          title="แชทใหม่"
          className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3 sm:gap-1.5"
        >
          <SquarePen size={16} />
          <span className="hidden sm:inline text-xs">แชทใหม่</span>
        </Button>
      </div>
    </motion.header>
  );
}

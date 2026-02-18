"use client";

import { motion, AnimatePresence } from "framer-motion";
import { KnowledgeManager } from "@/components/knowledge/KnowledgeManager";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
          {/* Panel */}
          <div className="fixed right-0 top-0 bottom-0 z-50 lg:relative">
            <KnowledgeManager onClose={onClose} />
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

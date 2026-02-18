"use client";

import { motion } from "framer-motion";
import { Database, X } from "lucide-react";
import { JsonUploader } from "./JsonUploader";
import { DataPreview } from "./DataPreview";
import { Button } from "@/components/ui/Button";

interface KnowledgeManagerProps {
  onClose: () => void;
}

export function KnowledgeManager({ onClose }: KnowledgeManagerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="w-96 h-full border-l border-white/10 bg-black/40 backdrop-blur-xl flex flex-col"
    >
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Database size={16} className="text-orange-400" />
          <span className="text-sm font-medium text-white/90">Knowledge Base</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X size={16} />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
        <JsonUploader />
        <DataPreview />
      </div>
    </motion.div>
  );
}

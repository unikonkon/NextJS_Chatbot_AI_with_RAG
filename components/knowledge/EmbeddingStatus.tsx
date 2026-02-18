"use client";

import { motion } from "framer-motion";
import { Loader2, AlertCircle, Database, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface EmbeddingStatusProps {
  isInitializing: boolean;
  error: string | null;
  productsCount: number;
  embeddingsCount: number;
  onRetry?: () => void;
}

export function EmbeddingStatus({
  isInitializing,
  error,
  productsCount,
  embeddingsCount,
  onRetry,
}: EmbeddingStatusProps) {
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-4 mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 flex items-center gap-3"
      >
        <AlertCircle size={18} className="text-red-400 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-red-300 font-medium">เกิดข้อผิดพลาดในการเริ่มต้น</p>
          <p className="text-[11px] text-red-300/70 truncate">{error}</p>
        </div>
        {onRetry && (
          <Button variant="ghost" size="sm" onClick={onRetry}>
            <RefreshCw size={14} />
            ลองใหม่
          </Button>
        )}
      </motion.div>
    );
  }

  if (isInitializing) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-4 mt-4 rounded-xl border border-orange-500/30 bg-orange-500/10 p-3 flex items-center gap-3"
      >
        <Loader2 size={18} className="text-orange-400 animate-spin flex-shrink-0" />
        <div className="flex-1">
          <p className="text-xs text-orange-300 font-medium">
            กำลังเตรียม Knowledge Base...
          </p>
          <p className="text-[11px] text-orange-300/70">
            โหลด Embedding Model & สร้าง Vectors (อาจใช้เวลา 30-60 วินาทีในครั้งแรก)
          </p>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-orange-300/50">
          <Database size={12} />
          {embeddingsCount}/{productsCount || "..."}
        </div>
      </motion.div>
    );
  }

  return null;
}

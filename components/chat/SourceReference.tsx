"use client";

import { motion } from "framer-motion";
import { Package, Star, Tag } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { formatPrice, formatSimilarity } from "@/lib/utils/format";
import type { SourceReference as SourceRefType } from "@/types/chat";

interface SourceReferenceProps {
  sources: SourceRefType[];
}

export function SourceReference({ sources }: SourceReferenceProps) {
  if (!sources || sources.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="mt-3 pt-3 border-t border-white/10"
    >
      <p className="text-[10px] uppercase tracking-wider text-white/40 mb-2 flex items-center gap-1">
        <Tag size={10} />
        Sources
      </p>
      <div className="flex flex-wrap gap-1.5">
        {sources.map((source, i) => (
          <motion.div
            key={source.productId}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 * i }}
            className="flex items-center gap-1.5 rounded-lg bg-white/5 border border-white/10 px-2 py-1"
          >
            <Package size={10} className="text-orange-400" />
            <span className="text-[11px] text-white/70 max-w-[120px] truncate">
              {source.productName}
            </span>
            <Badge variant="default" className="text-[9px] px-1.5 py-0">
              {formatSimilarity(source.similarity)}
            </Badge>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

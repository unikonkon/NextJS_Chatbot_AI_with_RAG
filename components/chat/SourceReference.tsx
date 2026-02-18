"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Package, Tag, Loader2, Brain, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { ProductModal } from "@/components/ui/ProductModal";
import { formatSimilarity } from "@/lib/utils/format";
import type { SourceReference as SourceRefType } from "@/types/chat";
import type { Product } from "@/types/knowledge";

interface SourceReferenceProps {
  sources: SourceRefType[];
}

// Cache fetched products so we don't re-fetch on every click
let productsCache: Product[] | null = null;

export function SourceReference({ sources }: SourceReferenceProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSource, setSelectedSource] = useState<SourceRefType | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [showMatchInfo, setShowMatchInfo] = useState(false);

  const handleClick = useCallback(async (source: SourceRefType) => {
    setLoadingId(source.productId);

    try {
      // Use cached products if available
      if (!productsCache) {
        const res = await fetch("/api/knowledge");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        productsCache = data.products;
      }

      const product = productsCache?.find((p) => p.id === source.productId);
      if (product) {
        setSelectedProduct(product);
        setSelectedSource(source);
      }
    } catch {
      // silently fail
    } finally {
      setLoadingId(null);
    }
  }, []);

  if (!sources || sources.length === 0) return null;

  const topSource = sources[0];

  return (
    <>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="mt-3 pt-3 border-t border-white/10"
      >
        <p className="text-[10px] uppercase tracking-wider text-white/40 mb-2 flex items-center gap-1">
          <Tag size={10} />
          Sources (กดเพื่อดูรายละเอียด)
        </p>
        <div className="flex flex-wrap gap-1.5">
          {sources.map((source, i) => (
            <motion.button
              key={source.productId}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * i }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleClick(source)}
              disabled={loadingId === source.productId}
              className="flex items-center gap-1.5 rounded-lg bg-white/5 border border-white/10 px-2 py-1 hover:bg-white/10 hover:border-orange-500/30 transition-all duration-150 cursor-pointer disabled:opacity-50"
            >
              {loadingId === source.productId ? (
                <Loader2 size={10} className="text-orange-400 animate-spin" />
              ) : (
                <Package size={10} className="text-orange-400" />
              )}
              <span className="text-[11px] text-white/70 max-w-[120px] truncate">
                {source.productName}
              </span>
              <Badge variant="default" className="text-[9px] px-1.5 py-0">
                #{source.rank} {formatSimilarity(source.similarity)}
              </Badge>
            </motion.button>
          ))}
        </div>

        {/* Match Analysis Toggle */}
        <button
          onClick={() => setShowMatchInfo(!showMatchInfo)}
          className="mt-2 flex items-center gap-1 text-[10px] text-white/25 hover:text-white/50 transition-colors cursor-pointer"
        >
          <Brain size={10} />
          <span>วิธีการจับคู่ (Match Analysis)</span>
          <ChevronDown
            size={10}
            className={`transition-transform ${showMatchInfo ? "rotate-180" : ""}`}
          />
        </button>

        <AnimatePresence>
          {showMatchInfo && topSource && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-1.5 rounded-lg bg-white/3 border border-white/8 p-2.5 space-y-1.5">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
                  <div className="flex justify-between">
                    <span className="text-white/30">Method</span>
                    <span className="text-white/60 font-medium">Cosine Similarity</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/30">Model</span>
                    <span className="text-white/60 font-medium truncate ml-1">
                      {topSource.embeddingModel?.split("/").pop() || "MiniLM-L12"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/30">Dimensions</span>
                    <span className="text-white/60 font-medium">{topSource.dimensions || 384}d</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/30">Threshold</span>
                    <span className="text-white/60 font-medium">
                      {topSource.similarityThreshold
                        ? `${(topSource.similarityThreshold * 100).toFixed(0)}%`
                        : "30%"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/30">Candidates</span>
                    <span className="text-white/60 font-medium">{topSource.totalCandidates || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/30">Matched</span>
                    <span className="text-white/60 font-medium">{sources.length} results</span>
                  </div>
                </div>
                <p className="text-[9px] text-white/20 leading-relaxed pt-1 border-t border-white/5">
                  คำถามของคุณถูกแปลงเป็น vector {topSource.dimensions || 384} มิติ แล้วเปรียบเทียบกับสินค้า {topSource.totalCandidates || "—"} รายการ
                  ด้วย Cosine Similarity เลือกผลลัพธ์ที่เกิน {topSource.similarityThreshold ? `${(topSource.similarityThreshold * 100).toFixed(0)}` : "30"}% มาแสดง
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Product Detail Modal */}
      <AnimatePresence>
        {selectedProduct && selectedSource && (
          <ProductModal
            product={selectedProduct}
            similarity={selectedSource.similarity}
            matchInfo={{
              rank: selectedSource.rank,
              matchedChunkText: selectedSource.matchedChunkText,
              embeddingModel: selectedSource.embeddingModel,
              similarityThreshold: selectedSource.similarityThreshold,
              totalCandidates: selectedSource.totalCandidates,
              dimensions: selectedSource.dimensions,
              totalMatched: sources.length,
            }}
            onClose={() => {
              setSelectedProduct(null);
              setSelectedSource(null);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

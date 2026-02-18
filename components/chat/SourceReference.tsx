"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Package, Tag, Loader2 } from "lucide-react";
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
  const [selectedSimilarity, setSelectedSimilarity] = useState<number>(0);
  const [loadingId, setLoadingId] = useState<string | null>(null);

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
        setSelectedSimilarity(source.similarity);
      }
    } catch {
      // silently fail
    } finally {
      setLoadingId(null);
    }
  }, []);

  if (!sources || sources.length === 0) return null;

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
                {formatSimilarity(source.similarity)}
              </Badge>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Product Detail Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <ProductModal
            product={selectedProduct}
            similarity={selectedSimilarity}
            onClose={() => setSelectedProduct(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

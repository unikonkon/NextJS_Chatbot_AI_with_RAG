"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Database,
  Star,
  Search,
  Eye,
  Tag,
  ChevronDown,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ProductModal } from "@/components/ui/ProductModal";
import { formatPrice, formatNumber } from "@/lib/utils/format";
import type { Product } from "@/types/knowledge";

// ─── Data Preview (Main) ────────────────────────────────────────

interface DataPreviewProps {
  refreshKey?: number;
}

export function DataPreview({ refreshKey = 0 }: DataPreviewProps) {
  const [data, setData] = useState<{
    productsCount: number;
    products: Product[];
  } | null>(null);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);

  useEffect(() => {
    fetch("/api/knowledge")
      .then((res) => res.json())
      .then(setData)
      .catch(() => {});
  }, [refreshKey]);

  const categories = useMemo(() => {
    if (!data) return [];
    const cats = [...new Set(data.products.map((p) => p.category))].sort();
    return cats;
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    let items = data.products;

    if (selectedCategory !== "all") {
      items = items.filter((p) => p.category === selectedCategory);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)) ||
          p.description.toLowerCase().includes(q)
      );
    }

    return items;
  }, [data, search, selectedCategory]);

  if (!data || data.productsCount === 0) return null;

  return (
    <>
      <Card className="space-y-3 p-3!">
        {/* Header */}
        {/* <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database size={14} className="text-orange-400" />
            <span className="text-xs font-medium text-white/70">
              Knowledge Base
            </span>
          </div>
          <span className="text-[10px] text-white/30 tabular-nums">
            {filtered.length}/{data.productsCount} items
          </span>
        </div> */}

        {/* Search */}
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/20" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาสินค้า..."
            className="w-full rounded-lg bg-white/5 border border-white/10 pl-8 pr-3 py-1.5 text-[11px] text-white/80 placeholder-white/20 outline-none focus:border-orange-500/40 transition-colors"
          />
        </div>

        {/* Category filter */}
        <div className="relative">
          <button
            onClick={() => setShowCategoryMenu(!showCategoryMenu)}
            className="flex items-center gap-1.5 w-full rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-[11px] text-white/60 hover:border-white/20 transition-colors cursor-pointer"
          >
            <Tag size={11} className="text-white/30" />
            <span className="flex-1 text-left truncate">
              {selectedCategory === "all" ? "ทุกหมวดหมู่" : selectedCategory}
            </span>
            <ChevronDown size={12} className={`text-white/30 transition-transform ${showCategoryMenu ? "rotate-180" : ""}`} />
          </button>

          <AnimatePresence>
            {showCategoryMenu && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute z-20 mt-1 w-full max-h-[180px] overflow-y-auto rounded-xl bg-[#111] border border-white/10 py-1 shadow-xl"
              >
                <button
                  onClick={() => { setSelectedCategory("all"); setShowCategoryMenu(false); }}
                  className={`w-full px-3 py-1.5 text-left text-[11px] transition-colors cursor-pointer ${selectedCategory === "all" ? "text-orange-400 bg-orange-500/10" : "text-white/50 hover:text-white/80 hover:bg-white/5"}`}
                >
                  ทุกหมวดหมู่ ({data.productsCount})
                </button>
                {categories.map((cat) => {
                  const count = data.products.filter((p) => p.category === cat).length;
                  return (
                    <button
                      key={cat}
                      onClick={() => { setSelectedCategory(cat); setShowCategoryMenu(false); }}
                      className={`w-full px-3 py-1.5 text-left text-[11px] flex items-center justify-between transition-colors cursor-pointer ${selectedCategory === cat ? "text-orange-400 bg-orange-500/10" : "text-white/50 hover:text-white/80 hover:bg-white/5"}`}
                    >
                      <span>{cat}</span>
                      <span className="text-[9px] text-white/20">{count}</span>
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Product List */}
        <div className="space-y-1 max-h-[calc(100vh-420px)] overflow-y-auto pr-0.5">
          {filtered.length === 0 && (
            <p className="text-[11px] text-white/30 text-center py-4">
              ไม่พบสินค้าที่ตรงกับการค้นหา
            </p>
          )}

          {filtered.map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(i * 0.02, 0.5) }}
              className="group flex items-center gap-2 rounded-xl bg-white/3 hover:bg-white/7 border border-transparent hover:border-white/10 px-2.5 py-2 transition-all duration-150"
            >
              {/* Info */}
              <div className="flex-1 min-w-0 space-y-0.5">
                <p className="text-[11px] text-white/80 font-medium truncate leading-tight">
                  {product.name}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-orange-400 font-semibold">
                    {formatPrice(product.price)}
                  </span>
                  {product.discount && (
                    <span className="text-[9px] text-red-400/70">{product.discount}</span>
                  )}
                  <span className="flex items-center gap-0.5 text-[9px] text-white/30">
                    <Star size={8} className="text-amber-400 fill-amber-400" />
                    {product.rating}
                  </span>
                  <span className="text-[9px] text-white/20">
                    {formatNumber(product.soldCount)} sold
                  </span>
                </div>
              </div>

              {/* View button */}
              <button
                onClick={() => setSelectedProduct(product)}
                className="shrink-0 flex items-center justify-center w-7 h-7 rounded-lg group-hover:bg-white/10 text-white/20 group-hover:text-orange-400 transition-all duration-150 cursor-pointer"
                title="ดูรายละเอียด"
              >
                <Eye size={14} />
              </button>
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Product Detail Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <ProductModal
            product={selectedProduct}
            onClose={() => setSelectedProduct(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

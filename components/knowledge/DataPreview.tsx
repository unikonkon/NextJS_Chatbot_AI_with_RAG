"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Database,
  Star,
  ShoppingCart,
  Search,
  Eye,
  X,
  Tag,
  Store,
  MapPin,
  Shield,
  Undo2,
  Truck,
  BadgeCheck,
  ChevronDown,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { formatPrice, formatNumber } from "@/lib/utils/format";
import type { Product } from "@/types/knowledge";

// ─── Product Detail Modal ───────────────────────────────────────

interface ProductModalProps {
  product: Product;
  onClose: () => void;
}

function ProductModal({ product, onClose }: ProductModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-100 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg max-h-[85vh] overflow-hidden rounded-2xl border border-white/10 bg-[#0c0c0c] shadow-2xl shadow-black/50"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-white/10 bg-[#0c0c0c]/95 backdrop-blur-xl p-4">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-white/95 leading-snug">
              {product.name}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <Badge variant="info" className="text-[9px]">{product.category}</Badge>
              <Badge variant="default" className="text-[9px]">{product.brand}</Badge>
              {product.isMall && (
                <Badge variant="success" className="text-[9px]">Mall</Badge>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto max-h-[calc(85vh-64px)] p-4 space-y-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
          {/* Price Section */}
          <div className="rounded-xl bg-linear-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 p-3">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-orange-400">
                {formatPrice(product.price)}
              </span>
              {product.discount && (
                <>
                  <span className="text-xs text-white/30 line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                  <Badge variant="warning" className="text-[9px]">
                    {product.discount}
                  </Badge>
                </>
              )}
            </div>
            <div className="mt-2 flex items-center gap-4 text-[11px] text-white/50">
              <span className="flex items-center gap-1">
                <Star size={11} className="text-amber-400 fill-amber-400" />
                {product.rating}
              </span>
              <span className="flex items-center gap-1">
                <ShoppingCart size={11} />
                ขายแล้ว {formatNumber(product.soldCount)} ชิ้น
              </span>
            </div>
          </div>

          {/* Description */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-white/30 mb-1.5">รายละเอียด</p>
            <p className="text-xs text-white/60 leading-relaxed">{product.description}</p>
          </div>

          {/* Specs */}
          {Object.keys(product.specs).length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-white/30 mb-1.5">สเปค</p>
              <div className="grid grid-cols-2 gap-1">
                {Object.entries(product.specs).map(([key, value]) => (
                  <div
                    key={key}
                    className="rounded-lg bg-white/3 border border-white/5 px-2.5 py-1.5"
                  >
                    <p className="text-[9px] text-white/30 capitalize">{key}</p>
                    <p className="text-[11px] text-white/70 font-medium">
                      {typeof value === "boolean" ? (value ? "Yes" : "No") : String(value)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {product.tags.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-white/30 mb-1.5">แท็ก</p>
              <div className="flex flex-wrap gap-1">
                {product.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] text-white/50"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Shop Info */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-white/30 mb-1.5">ร้านค้า</p>
            <div className="rounded-xl bg-white/3 border border-white/5 p-3 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs text-white/70">
                <Store size={12} className="text-white/30" />
                {product.shopName}
                {product.isPreferred && (
                  <BadgeCheck size={12} className="text-blue-400" />
                )}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-white/40">
                <MapPin size={11} className="text-white/20" />
                {product.shopLocation}
              </div>
            </div>
          </div>

          {/* Policies */}
          <div className="grid grid-cols-3 gap-1.5">
            <div className="rounded-lg bg-white/3 border border-white/5 p-2 text-center">
              <Shield size={14} className="mx-auto text-emerald-400/60 mb-1" />
              <p className="text-[9px] text-white/30">รับประกัน</p>
              <p className="text-[10px] text-white/60 font-medium leading-tight mt-0.5">{product.warranty}</p>
            </div>
            <div className="rounded-lg bg-white/3 border border-white/5 p-2 text-center">
              <Undo2 size={14} className="mx-auto text-blue-400/60 mb-1" />
              <p className="text-[9px] text-white/30">คืนสินค้า</p>
              <p className="text-[10px] text-white/60 font-medium leading-tight mt-0.5">{product.returnPolicy}</p>
            </div>
            <div className="rounded-lg bg-white/3 border border-white/5 p-2 text-center">
              <Truck size={14} className={`mx-auto mb-1 ${product.freeShipping ? "text-orange-400/60" : "text-white/20"}`} />
              <p className="text-[9px] text-white/30">จัดส่ง</p>
              <p className="text-[10px] text-white/60 font-medium leading-tight mt-0.5">
                {product.freeShipping ? "ส่งฟรี" : "มีค่าส่ง"}
              </p>
            </div>
          </div>

          {/* Product ID */}
          <p className="text-[9px] text-white/20 text-right">ID: {product.id}</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Data Preview (Main) ────────────────────────────────────────

export function DataPreview() {
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
  }, []);

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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database size={14} className="text-orange-400" />
            <span className="text-xs font-medium text-white/70">
              Knowledge Base
            </span>
          </div>
          <span className="text-[10px] text-white/30 tabular-nums">
            {filtered.length}/{data.productsCount} items
          </span>
        </div>

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
                className="absolute z-20 mt-1 w-full max-h-[180px] overflow-y-auto rounded-xl bg-[#111] border border-white/10 py-1 shadow-xl scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10"
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
        <div className="space-y-1 max-h-[calc(100vh-420px)] overflow-y-auto pr-0.5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
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

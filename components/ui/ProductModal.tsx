"use client";

import { motion } from "framer-motion";
import {
  Star,
  ShoppingCart,
  X,
  Store,
  MapPin,
  Shield,
  Undo2,
  Truck,
  BadgeCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { formatPrice, formatNumber } from "@/lib/utils/format";
import type { Product } from "@/types/knowledge";

interface ProductModalProps {
  product: Product;
  similarity?: number;
  onClose: () => void;
}

export function ProductModal({ product, similarity, onClose }: ProductModalProps) {
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
        className="relative w-full max-w-[900px] max-h-[85vh] overflow-hidden rounded-2xl border border-white/10 bg-[#0c0c0c] shadow-2xl shadow-black/50"
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
              {similarity !== undefined && (
                <Badge variant="warning" className="text-[9px]">
                  Match {(similarity * 100).toFixed(0)}%
                </Badge>
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

"use client";

import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Database,
  Package,
  Plus,
  TriangleAlert,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useKnowledge } from "@/hooks/useKnowledge";

interface JsonUploaderProps {
  onDataChange?: () => void;
}

export function JsonUploader({ onDataChange }: JsonUploaderProps) {
  const { status, uploadFile, clearCustomProducts } = useKnowledge();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const atCapacity = status.productsCount >= status.maxProducts;
  const capacityPercent =
    status.maxProducts > 0
      ? Math.round((status.productsCount / status.maxProducts) * 100)
      : 0;

  const capacityColor =
    capacityPercent > 90
      ? "bg-red-500"
      : capacityPercent > 70
        ? "bg-yellow-500"
        : "bg-emerald-500";

  const capacityTextColor =
    capacityPercent > 90
      ? "text-red-400"
      : capacityPercent > 70
        ? "text-yellow-400"
        : "text-emerald-400";

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        const result = await uploadFile(file);
        if (result) onDataChange?.();
      }
    },
    [uploadFile, onDataChange]
  );

  const [showSuccess, setShowSuccess] = useState(false);

  // Show success message for 3 seconds after custom products are added
  useEffect(() => {
    if (status.customProductsCount > 0 && !status.isUploading && !status.error) {
      setShowSuccess(true);
      const timer = setTimeout(() => setShowSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [status.customProductsCount, status.isUploading, status.error]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/json": [".json"] },
    maxFiles: 1,
    disabled: status.isUploading || atCapacity,
  });

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={cn(
          "relative rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-200 cursor-pointer",
          isDragActive
            ? "border-orange-500 bg-orange-500/10"
            : atCapacity
              ? "border-red-500/30 bg-red-500/5 cursor-not-allowed"
              : "border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10",
          (status.isUploading || atCapacity) && "opacity-50 pointer-events-none"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          {status.isUploading ? (
            <Loader2 size={32} className="text-orange-400 animate-spin" />
          ) : atCapacity ? (
            <Database size={32} className="text-red-400" />
          ) : (
            <Upload size={32} className="text-white/40" />
          )}
          <div>
            <p className="text-sm text-white/70">
              {isDragActive
                ? "วางไฟล์ JSON ที่นี่..."
                : status.isUploading
                  ? status.uploadProgress
                  : atCapacity
                    ? "ความจุเต็มแล้ว — ลบสินค้าเพิ่มเติมก่อน"
                    : "ลากไฟล์ JSON มาวางที่นี่ หรือคลิกเพื่อเลือก"}
            </p>
            <p className="text-xs text-white/40 mt-1">
              รองรับ KnowledgeBase JSON หรือ Product[] JSON
            </p>
          </div>
        </div>
      </div>

      {/* Capacity bar — always visible */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-2">
        {/* Progress bar */}
        <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
          <motion.div
            className={cn("h-full rounded-full", capacityColor)}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(capacityPercent, 100)}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>

        {/* Labels */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-white/50">
              <Package size={12} />
              สินค้าพื้นฐาน: {status.baseProductsCount}
            </span>
            <span className="flex items-center gap-1 text-orange-400">
              <Plus size={12} />
              สินค้าเพิ่มเติม: {status.customProductsCount}
            </span>
          </div>
          <span className={cn("font-medium", capacityTextColor)}>
            {status.productsCount} / {status.maxProducts}
          </span>
        </div>

        {/* Clear button */}
        {status.customProductsCount > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowConfirm(true);
            }}
            className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors mt-1 cursor-pointer"
          >
            <Trash2 size={12} />
            ล้างสินค้าเพิ่มเติม
          </button>
        )}
      </div>

      {/* Error message */}
      {status.error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2"
        >
          <AlertCircle size={14} className="text-red-400" />
          <span className="text-xs text-red-300">{status.error}</span>
        </motion.div>
      )}

      {/* Success message — auto-dismiss after 3 seconds */}
      {showSuccess && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2"
        >
          <CheckCircle2 size={14} className="text-emerald-400" />
          <span className="text-xs text-emerald-300">
            เพิ่มสินค้าสำเร็จ! รวม {status.productsCount} สินค้า
          </span>
        </motion.div>
      )}

      {/* Confirm clear modal */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-100 flex items-center justify-center p-4"
            onClick={() => !isClearing && setShowConfirm(false)}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-xs rounded-2xl border border-white/10 bg-[#0c0c0c] shadow-2xl overflow-hidden"
            >
              {/* Loading overlay */}
              <AnimatePresence>
                {isClearing && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#0c0c0c]/90 backdrop-blur-sm"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    >
                      <Loader2 size={28} className="text-red-400" />
                    </motion.div>
                    <p className="text-xs text-white/60">กำลังล้างข้อมูล...</p>
                    <div className="w-32 h-1 rounded-full bg-white/10 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-red-500"
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 2, ease: "easeInOut" }}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="p-5 space-y-4">
                {/* Icon */}
                <div className="flex justify-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 12, stiffness: 200 }}
                    className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center"
                  >
                    <TriangleAlert size={22} className="text-red-400" />
                  </motion.div>
                </div>

                {/* Text */}
                <div className="text-center space-y-1">
                  <h4 className="text-sm font-semibold text-white/90">
                    ยืนยันการล้างข้อมูล?
                  </h4>
                  <p className="text-xs text-white/50 leading-relaxed">
                    สินค้าเพิ่มเติมทั้งหมด{" "}
                    <span className="text-red-400 font-medium">
                      {status.customProductsCount} รายการ
                    </span>{" "}
                    จะถูกลบออกจาก Knowledge Base
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowConfirm(false)}
                    disabled={isClearing}
                    className="flex-1 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs text-white/60 hover:bg-white/10 hover:text-white/80 transition-colors cursor-pointer disabled:opacity-40"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={async () => {
                      setIsClearing(true);
                      await clearCustomProducts();
                      onDataChange?.();
                      setIsClearing(false);
                      setShowConfirm(false);
                    }}
                    disabled={isClearing}
                    className="flex-1 rounded-xl bg-red-500/15 border border-red-500/30 px-3 py-2 text-xs text-red-400 hover:bg-red-500/25 transition-colors cursor-pointer disabled:opacity-40 font-medium"
                  >
                    ล้างข้อมูล
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

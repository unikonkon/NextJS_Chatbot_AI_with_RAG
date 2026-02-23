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
  Info,
  Download,
  X,
  FileJson,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface KnowledgeStatus {
  isUploading: boolean;
  uploadProgress: string;
  error: string | null;
  productsCount: number;
  baseProductsCount: number;
  customProductsCount: number;
  maxProducts: number;
}

interface JsonUploaderProps {
  status: KnowledgeStatus;
  uploadFile: (file: File) => Promise<unknown>;
  clearCustomProducts: () => Promise<void>;
  onDataChange?: () => void;
}

const SAMPLE_PRODUCTS = [
  {
    id: "sample-001",
    name: "หูฟังบลูทูธ รุ่น Pro Max",
    description: "หูฟังไร้สายคุณภาพสูง ตัดเสียงรบกวน ANC รองรับ Bluetooth 5.3 แบตอึด 30 ชม.",
    price: 1290,
    originalPrice: 2590,
    discount: "-50%",
    soldCount: 5200,
    rating: 4.8,
    shopName: "TechStore Official",
    shopLocation: "กรุงเทพมหานคร",
    isMall: true,
    isPreferred: true,
    freeShipping: true,
    category: "อิเล็กทรอนิกส์",
    brand: "ProMax",
    tags: ["หูฟัง", "บลูทูธ", "ANC", "ไร้สาย"],
    specs: { connectivity: "Bluetooth 5.3", battery: "30 ชม.", driver: "40mm" },
    warranty: "1 ปี",
    returnPolicy: "คืนได้ภายใน 15 วัน",
  },
];

function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const SAMPLE_KNOWLEDGE_BASE = {
  version: "1.0",
  name: "Sample Knowledge Base",
  description: "ตัวอย่างไฟล์ KnowledgeBase สำหรับทดสอบ",
  source: "manual",
  scrapedAt: new Date().toISOString(),
  totalProducts: SAMPLE_PRODUCTS.length,
  categories: ["อิเล็กทรอนิกส์"],
  products: SAMPLE_PRODUCTS,
};

export function JsonUploader({ status, uploadFile, clearCustomProducts, onDataChange }: JsonUploaderProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [showFormatInfo, setShowFormatInfo] = useState(false);

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

  const [showSuccess, setShowSuccess] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        const result = await uploadFile(file);
        if (result) {
          setShowSuccess(true);
          onDataChange?.();
        }
      }
    },
    [uploadFile, onDataChange]
  );

  // Auto-dismiss success message after 3 seconds
  useEffect(() => {
    if (!showSuccess) return;
    const timer = setTimeout(() => setShowSuccess(false), 3000);
    return () => clearTimeout(timer);
  }, [showSuccess]);

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
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowFormatInfo(true);
              }}
              className="inline-flex items-center gap-1 text-[15px] text-orange-400/70 hover:text-orange-400 transition-colors mt-2 cursor-pointer"
            >
              <Info size={12} />
              รายละเอียดรูปแบบไฟล์
            </button>
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

      {/* Format info modal */}
      <AnimatePresence>
        {showFormatInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-100 flex items-center justify-center p-4"
            onClick={() => setShowFormatInfo(false)}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md max-h-[85vh] rounded-2xl border border-white/10 bg-[#0c0c0c] shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <FileJson size={16} className="text-orange-400" />
                  <h4 className="text-sm font-semibold text-white/90">
                    รูปแบบไฟล์ JSON
                  </h4>
                </div>
                <button
                  onClick={() => setShowFormatInfo(false)}
                  className="rounded-lg p-1.5 text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Format 1 */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-orange-400">
                    รูปแบบที่ 1 — Product Array
                  </p>
                  <p className="text-[11px] text-white/50 leading-relaxed">
                    ไฟล์ JSON ที่เป็น Array ของ Product โดยตรง
                  </p>
                  <pre className="rounded-lg bg-white/3 border border-white/5 p-3 text-[10px] text-white/50 leading-relaxed overflow-x-auto font-mono">
{`[
  {
    "id": "string",
    "name": "string",
    "description": "string",
    "price": number,
    "originalPrice": number,
    "discount": "string" | null,
    "soldCount": number,
    "rating": number (0-5),
    "shopName": "string",
    "shopLocation": "string",
    "isMall": boolean,
    "isPreferred": boolean,
    "freeShipping": boolean,
    "category": "string",
    "brand": "string",
    "tags": ["string", ...],
    "specs": { "key": "value", ... },
    "warranty": "string",
    "returnPolicy": "string"
  }
]`}
                  </pre>
                </div>

                {/* Format 2 */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-orange-400">
                    รูปแบบที่ 2 — KnowledgeBase Object
                  </p>
                  <p className="text-[11px] text-white/50 leading-relaxed">
                    ไฟล์ JSON แบบ KnowledgeBase ที่มี metadata ครอบ products
                  </p>
                  <pre className="rounded-lg bg-white/3 border border-white/5 p-3 text-[10px] text-white/50 leading-relaxed overflow-x-auto font-mono">
{`{
  "version": "1.0",
  "name": "string",
  "description": "string",
  "source": "string",
  "scrapedAt": "ISO date string",
  "totalProducts": number,
  "categories": ["string", ...],
  "products": [ ...Product[] ]
}`}
                  </pre>
                </div>

                {/* Required fields */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-white/70">
                    ฟิลด์ที่จำเป็นทั้งหมด (ทุกฟิลด์ต้องมี)
                  </p>
                  <div className="grid grid-cols-2 gap-1">
                    {[
                      { field: "id", type: "string" },
                      { field: "name", type: "string" },
                      { field: "description", type: "string" },
                      { field: "price", type: "number > 0" },
                      { field: "originalPrice", type: "number > 0" },
                      { field: "discount", type: "string | null" },
                      { field: "soldCount", type: "number >= 0" },
                      { field: "rating", type: "0 - 5" },
                      { field: "shopName", type: "string" },
                      { field: "shopLocation", type: "string" },
                      { field: "isMall", type: "boolean" },
                      { field: "isPreferred", type: "boolean" },
                      { field: "freeShipping", type: "boolean" },
                      { field: "category", type: "string" },
                      { field: "brand", type: "string" },
                      { field: "tags", type: "string[]" },
                      { field: "specs", type: "Record" },
                      { field: "warranty", type: "string" },
                      { field: "returnPolicy", type: "string" },
                    ].map((item) => (
                      <div
                        key={item.field}
                        className="flex items-center justify-between rounded-md bg-white/3 border border-white/5 px-2 py-1"
                      >
                        <span className="text-[10px] text-white/60 font-mono">
                          {item.field}
                        </span>
                        <span className="text-[9px] text-white/30">{item.type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer — Download samples */}
              <div className="p-4 border-t border-white/10 space-y-2">
                <p className="text-[11px] text-white/40 text-center mb-2">
                  ดาวน์โหลดไฟล์ตัวอย่าง
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadJson(SAMPLE_PRODUCTS, "sample-product-array.json");
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-orange-500/15 border border-orange-500/30 px-3 py-2.5 text-[11px] text-orange-400 hover:bg-orange-500/25 transition-colors cursor-pointer font-medium"
                  >
                    <Download size={13} />
                    Product Array
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadJson(SAMPLE_KNOWLEDGE_BASE, "sample-knowledge-base.json");
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-violet-500/15 border border-violet-500/30 px-3 py-2.5 text-[11px] text-violet-400 hover:bg-violet-500/25 transition-colors cursor-pointer font-medium"
                  >
                    <Download size={13} />
                    KnowledgeBase
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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

"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion } from "framer-motion";
import { Upload, FileJson, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useKnowledge } from "@/hooks/useKnowledge";

export function JsonUploader() {
  const { status, uploadFile } = useKnowledge();

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) uploadFile(file);
    },
    [uploadFile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/json": [".json"] },
    maxFiles: 1,
    disabled: status.isUploading,
  });

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={cn(
          "relative rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-200 cursor-pointer",
          isDragActive
            ? "border-orange-500 bg-orange-500/10"
            : "border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10",
          status.isUploading && "opacity-50 pointer-events-none"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          {status.isUploading ? (
            <Loader2 size={32} className="text-orange-400 animate-spin" />
          ) : (
            <Upload size={32} className="text-white/40" />
          )}
          <div>
            <p className="text-sm text-white/70">
              {isDragActive
                ? "วางไฟล์ JSON ที่นี่..."
                : status.isUploading
                ? status.uploadProgress
                : "ลากไฟล์ JSON มาวางที่นี่ หรือคลิกเพื่อเลือก"}
            </p>
            <p className="text-xs text-white/40 mt-1">
              รองรับไฟล์ .json (Shopee Products Knowledge Base)
            </p>
          </div>
        </div>
      </div>

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

      {status.productsCount > 0 && !status.isUploading && !status.error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2"
        >
          <CheckCircle2 size={14} className="text-emerald-400" />
          <span className="text-xs text-emerald-300">
            โหลดสำเร็จ! {status.productsCount} สินค้า
          </span>
        </motion.div>
      )}
    </div>
  );
}

"use client";

import { motion } from "framer-motion";
import {
  Loader2,
  AlertCircle,
  Database,
  RefreshCw,
  Download,
  Cpu,
  Server,
  Package,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { InitStep } from "@/hooks/useRAG";

interface EmbeddingStatusProps {
  isInitializing: boolean;
  error: string | null;
  productsCount: number;
  embeddingsCount: number;
  step?: InitStep;
  embeddingProgress?: { current: number; total: number } | null;
  onRetry?: () => void;
}

const STEP_CONFIG: Record<
  Exclude<InitStep, null>,
  { label: string; icon: typeof Loader2 }
> = {
  "loading-kb": { label: "กำลังโหลด Knowledge Base...", icon: Database },
  "loading-model": { label: "กำลังโหลด Embedding Model...", icon: Download },
  embedding: { label: "กำลังสร้าง Vectors...", icon: Cpu },
  storing: { label: "กำลังบันทึก Vectors...", icon: Server },
  "custom-products": { label: "กำลังโหลดสินค้าที่เพิ่มเอง...", icon: Package },
};

const STEP_ORDER: Exclude<InitStep, null>[] = [
  "loading-kb",
  "loading-model",
  "embedding",
  "storing",
];

export function EmbeddingStatus({
  isInitializing,
  error,
  step,
  embeddingProgress,
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
    const currentStepIndex = step ? STEP_ORDER.indexOf(step as any) : -1;

    // Calculate overall progress percentage
    let progressPercent = 0;
    if (step === "loading-kb") progressPercent = 5;
    else if (step === "loading-model") progressPercent = 15;
    else if (step === "embedding" && embeddingProgress) {
      progressPercent =
        20 + Math.round((embeddingProgress.current / embeddingProgress.total) * 65);
    } else if (step === "storing") progressPercent = 90;
    else if (step === "custom-products") progressPercent = 95;

    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-4 mt-4 rounded-xl border border-orange-500/30 bg-orange-500/10 p-4 space-y-3"
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          <Loader2 size={18} className="text-orange-400 animate-spin flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs text-orange-300 font-medium">
              กำลังเตรียม Knowledge Base...
            </p>
            <p className="text-[11px] text-orange-300/50">
              ครั้งแรกอาจใช้เวลา 30-60 วินาที (ดาวน์โหลด Model)
            </p>
          </div>
          <span className="text-[11px] text-orange-300/60 font-mono tabular-nums">
            {progressPercent}%
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>

        {/* Steps */}
        <div className="flex items-center gap-2 flex-wrap">
          {STEP_ORDER.map((s, i) => {
            const config = STEP_CONFIG[s];
            const Icon = config.icon;
            const isActive = s === step;
            const isDone = currentStepIndex > i;

            return (
              <div
                key={s}
                className={`flex items-center gap-1 text-[11px] rounded-full px-2 py-0.5 transition-colors ${
                  isActive
                    ? "bg-orange-500/20 text-orange-300"
                    : isDone
                      ? "bg-emerald-500/10 text-emerald-400/70"
                      : "text-white/20"
                }`}
              >
                {isDone ? (
                  <Check size={10} />
                ) : isActive ? (
                  <Loader2 size={10} className="animate-spin" />
                ) : (
                  <Icon size={10} />
                )}
                <span>{config.label.replace("กำลัง", "").replace("...", "")}</span>
                {isActive && s === "embedding" && embeddingProgress && (
                  <span className="font-mono tabular-nums ml-0.5">
                    ({embeddingProgress.current}/{embeddingProgress.total})
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>
    );
  }

  return null;
}

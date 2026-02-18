"use client";

import { useState, useCallback } from "react";
import { Database, X } from "lucide-react";
import { JsonUploader } from "./JsonUploader";
import { DataPreview } from "./DataPreview";
import { Button } from "@/components/ui/Button";

interface KnowledgeManagerProps {
  onClose: () => void;
}

export function KnowledgeManager({ onClose }: KnowledgeManagerProps) {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleDataChange = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <div className="w-96 h-full border-l border-white/10 bg-black/40 backdrop-blur-xl flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Database size={16} className="text-orange-400" />
          <span className="text-sm font-medium text-white/90">ฐานข้อมูลสินค้า</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X size={16} />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <JsonUploader onDataChange={handleDataChange} />
        <DataPreview refreshKey={refreshKey} />
      </div>
    </div>
  );
}

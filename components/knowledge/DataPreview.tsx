"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Database, Package, Star, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { formatPrice, formatNumber } from "@/lib/utils/format";

interface ProductPreview {
  id: string;
  name: string;
  category: string;
  brand: string;
  price: number;
  rating: number;
}

export function DataPreview() {
  const [data, setData] = useState<{
    productsCount: number;
    products: ProductPreview[];
  } | null>(null);

  useEffect(() => {
    fetch("/api/knowledge")
      .then((res) => res.json())
      .then(setData)
      .catch(() => {});
  }, []);

  if (!data || data.productsCount === 0) return null;

  return (
    <Card className="space-y-3">
      <div className="flex items-center gap-2">
        <Database size={14} className="text-orange-400" />
        <span className="text-xs font-medium text-white/70">
          Knowledge Base ({data.productsCount} products)
        </span>
      </div>
      <div className="grid gap-1.5 max-h-[200px] overflow-y-auto pr-1">
        {data.products.slice(0, 10).map((product, i) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-2 rounded-lg bg-white/5 px-2.5 py-1.5"
          >
            <Package size={12} className="text-white/30 flex-shrink-0" />
            <span className="text-[11px] text-white/60 flex-1 truncate">
              {product.name}
            </span>
            <Badge variant="info" className="text-[9px]">
              {product.category}
            </Badge>
            <span className="text-[10px] text-orange-400 font-medium">
              {formatPrice(product.price)}
            </span>
          </motion.div>
        ))}
        {data.productsCount > 10 && (
          <p className="text-[10px] text-white/30 text-center pt-1">
            +{data.productsCount - 10} more products
          </p>
        )}
      </div>
    </Card>
  );
}

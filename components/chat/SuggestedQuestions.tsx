"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { SUGGESTED_QUESTIONS } from "@/lib/utils/constants";

interface SuggestedQuestionsProps {
  onSelect: (question: string) => void;
  visible?: boolean;
}

export function SuggestedQuestions({ onSelect, visible = true }: SuggestedQuestionsProps) {
  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="flex flex-wrap gap-2 justify-center px-4"
    >
      {SUGGESTED_QUESTIONS.map((q, i) => (
        <motion.button
          key={q}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 * i + 0.3 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onSelect(q)}
          className="flex items-center gap-1.5 rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5 text-xs text-white/50 hover:text-white/80 hover:bg-white/8 hover:border-white/15 transition-all duration-200 cursor-pointer"
        >
          <Sparkles size={10} className="text-white/30" />
          {q}
        </motion.button>
      ))}
    </motion.div>
  );
}

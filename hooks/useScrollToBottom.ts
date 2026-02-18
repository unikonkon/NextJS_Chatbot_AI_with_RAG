"use client";

import { useEffect, useRef, useCallback } from "react";

export function useScrollToBottom<T extends HTMLElement>(
  dependency: unknown[]
) {
  const ref = useRef<T>(null);

  const scrollToBottom = useCallback(() => {
    if (ref.current) {
      ref.current.scrollTo({
        top: ref.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, dependency);

  return { ref, scrollToBottom };
}

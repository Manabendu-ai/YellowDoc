"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Reveals an element the first time it scrolls into view.
 *
 * Deliberately one-way and one curve for the whole site: things arrive, they
 * don't come and go as you scroll past. Anything already on screen at mount
 * is revealed immediately so the first paint is never blank.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(options?: {
  threshold?: number;
  rootMargin?: string;
}) {
  const ref = useRef<T | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || shown) return;

    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true);
            observer.disconnect();
          }
        }
      },
      {
        threshold: options?.threshold ?? 0.12,
        rootMargin: options?.rootMargin ?? "0px 0px -8% 0px",
      },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [shown, options?.threshold, options?.rootMargin]);

  return { ref, shown } as const;
}

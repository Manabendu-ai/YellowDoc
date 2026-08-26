"use client";

import { useReveal } from "@/hooks/useReveal";

/**
 * Wraps children in the site's one scroll-reveal behaviour. `delay` staggers
 * siblings; keep it under ~240ms so a row never feels like it is loading.
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, shown } = useReveal<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={`reveal${shown ? " is-in" : ""}${className ? ` ${className}` : ""}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}

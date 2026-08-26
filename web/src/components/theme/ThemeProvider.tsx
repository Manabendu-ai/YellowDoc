"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type ThemeChoice = "light" | "dark" | "system";

const STORAGE_KEY = "yellowdoc.theme";

type ThemeContextValue = {
  choice: ThemeChoice;
  setChoice: (next: ThemeChoice) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Runs before paint, so a dark-theme reload never flashes bone white.
 * Kept in sync with STORAGE_KEY above by hand — it cannot import anything.
 */
export const themeBootScript = `(function(){try{
var k="yellowdoc.theme",s=localStorage.getItem(k),c=s?JSON.parse(s):"system";
var d=c==="dark"||(c!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);
document.documentElement.classList.toggle("dark",d);
document.documentElement.style.colorScheme=d?"dark":"light";
}catch(e){}})();`;

function systemPrefersDark(): boolean {
  return (
    typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

/** Side effect only. The resolved value is never rendered, so nothing stores it. */
function apply(choice: ThemeChoice): void {
  const dark = choice === "dark" || (choice === "system" && systemPrefersDark());
  const root = document.documentElement;
  root.classList.toggle("dark", dark);
  root.style.colorScheme = dark ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [choice, setChoiceState] = useState<ThemeChoice>("system");

  // Adopt whatever the boot script already decided.
  useEffect(() => {
    let stored: ThemeChoice = "system";
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ThemeChoice;
        if (parsed === "light" || parsed === "dark" || parsed === "system") stored = parsed;
      }
    } catch {
      /* Fall back to following the system. */
    }
    setChoiceState(stored);
    apply(stored);
  }, []);

  // Follow the OS while the choice is "system".
  useEffect(() => {
    if (choice !== "system" || typeof window === "undefined") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => apply("system");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [choice]);

  const setChoice = useCallback((next: ThemeChoice) => {
    setChoiceState(next);
    apply(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* The choice still applies for this session. */
    }
  }, []);

  const value = useMemo(() => ({ choice, setChoice }), [choice, setChoice]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useTheme must be used inside ThemeProvider.");
  return value;
}

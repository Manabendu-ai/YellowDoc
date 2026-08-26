"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * State that survives a reload. Reads on mount rather than during render so
 * the server and client first paint agree, and writes from an effect so the
 * state updater itself stays pure — React may call it twice in StrictMode.
 */
export function useStoredState<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(fallback);
  const [loaded, setLoaded] = useState(false);
  const hydrating = useRef(true);

  useEffect(() => {
    hydrating.current = true;
    setLoaded(false);
    try {
      const raw = window.localStorage.getItem(key);
      setValue(raw !== null ? (JSON.parse(raw) as T) : fallback);
    } catch {
      /* Private mode, quota, or hand-edited garbage — keep the fallback. */
    }
    setLoaded(true);
    // `fallback` is deliberately not a dependency: callers pass a fresh
    // literal every render, which would re-read storage forever.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    // Don't write the fallback back over stored data on the first pass.
    if (!loaded) return;
    if (hydrating.current) {
      hydrating.current = false;
      return;
    }
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* Nothing useful to do; the value still lives in memory. */
    }
  }, [key, value, loaded]);

  /* setValue already accepts either a value or an updater; persistence is the
     effect above's job, so this is a pass-through with a stable identity. */
  const write = useCallback((next: T | ((current: T) => T)) => setValue(next), []);

  return [value, write, loaded] as const;
}

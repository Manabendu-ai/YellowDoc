"use client";

import { useCallback } from "react";
import { useStoredState } from "@/hooks/useStoredState";
import type { ConversionRecord } from "@/lib/types";

const KEY = "yellowdoc.conversions";
const CAP = 60;

/**
 * The backend keeps no record of what it has produced — `excel_files/` is just
 * a directory. So the browser holds the log, which is also why History can
 * only ever show conversions made on this machine.
 */
export function useConversions() {
  const [records, write, loaded] = useStoredState<ConversionRecord[]>(KEY, []);

  const add = useCallback(
    (record: ConversionRecord) => {
      write((current) => [record, ...current.filter((r) => r.id !== record.id)].slice(0, CAP));
    },
    [write],
  );

  const remove = useCallback(
    (id: string) => {
      write((current) => current.filter((record) => record.id !== id));
    },
    [write],
  );

  const clear = useCallback(() => write([]), [write]);

  return { records, add, remove, clear, loaded };
}

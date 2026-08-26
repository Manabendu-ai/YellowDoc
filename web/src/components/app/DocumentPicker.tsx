"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ChevronDownIcon, RefreshIcon } from "@/components/ui/Icons";
import { RequestFailed, listDocuments } from "@/lib/api";
import { ALL_DOCUMENTS } from "@/lib/scope";
import type { IndexedDocument } from "@/lib/types";

type Props = {
  value: string;
  onChange: (source: string) => void;
  disabled?: boolean;
};

type Load =
  | { state: "loading" }
  | { state: "ready"; documents: IndexedDocument[] }
  | { state: "failed"; reason: string };

/**
 * Chooses which document a question is allowed to see.
 *
 * This exists because unscoped retrieval over several near-identical invoices
 * reliably answers from the wrong one: the chunks are so similar that the
 * document you meant may not make the global top-k at all. Naming the file in
 * the question does not help — the model can only work with the passages it is
 * handed. Scoping is enforced during retrieval instead.
 */
export function DocumentPicker({ value, onChange, disabled }: Props) {
  const [load, setLoad] = useState<Load>({ state: "loading" });
  const selectId = useId();
  /* Cleared on unmount so a slow first load — which can be a full index
     rebuild — cannot call setState after the screen has gone. */
  const alive = useRef(true);

  const refresh = useCallback(async () => {
    setLoad({ state: "loading" });
    try {
      const documents = await listDocuments();
      if (!alive.current) return;
      setLoad({ state: "ready", documents });
    } catch (error) {
      if (!alive.current) return;
      setLoad({
        state: "failed",
        reason:
          error instanceof RequestFailed
            ? [error.message, error.detail].filter(Boolean).join(" ")
            : "The list of documents could not be read.",
      });
    }
  }, []);

  useEffect(() => {
    alive.current = true;
    void refresh();
    return () => {
      alive.current = false;
    };
  }, [refresh]);

  const documents = load.state === "ready" ? load.documents : [];

  /* A selection can outlive the document it names: the thread is restored from
     localStorage, but md_files/ may have been cleared since. Fall back rather
     than silently sending a scope the backend will reject. */
  useEffect(() => {
    if (load.state !== "ready" || !value) return;
    if (!documents.some((doc) => doc.source === value)) onChange(ALL_DOCUMENTS);
  }, [documents, load.state, onChange, value]);

  const empty = load.state === "ready" && documents.length === 0;

  return (
    <div className="card flex flex-wrap items-end gap-3 p-4">
      <div className="min-w-0 flex-1">
        <label htmlFor={selectId} className="label">
          Ask about
        </label>
        <div className="relative">
          <select
            id={selectId}
            className="input select"
            value={value}
            disabled={disabled || load.state === "loading" || empty}
            onChange={(event) => onChange(event.target.value)}
          >
            <option value={ALL_DOCUMENTS}>
              {empty ? "No documents indexed yet" : "All documents"}
            </option>
            {documents.map((doc) => (
              <option key={doc.source} value={doc.source}>
                {doc.document} · {doc.chunks} {doc.chunks === 1 ? "passage" : "passages"}
              </option>
            ))}
          </select>
          <ChevronDownIcon size={16} className="select-caret" />
        </div>
      </div>

      <button
        type="button"
        className="btn btn-quiet btn-sm"
        onClick={() => void refresh()}
        disabled={disabled || load.state === "loading"}
      >
        <RefreshIcon size={15} />
        {load.state === "loading" ? "Checking…" : "Refresh"}
      </button>

      <p className="t-data w-full text-fg-3" role="status">
        {load.state === "loading"
          ? "Reading the search index…"
          : load.state === "failed"
            ? load.reason
            : empty
              ? "Convert a document and it appears here."
              : value
                ? `Retrieval is restricted to ${value}. Nothing else can reach the answer.`
                : `Searching all ${documents.length} indexed ${
                    documents.length === 1 ? "document" : "documents"
                  }. Pick one if answers are coming from the wrong file.`}
      </p>
    </div>
  );
}

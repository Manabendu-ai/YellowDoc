"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Dropzone } from "@/components/app/Dropzone";
import { PipelineProgress } from "@/components/app/PipelineProgress";
import { DownloadIcon, SheetIcon, UploadIcon } from "@/components/ui/Icons";
import { Notice } from "@/components/ui/Notice";
import { useConversions } from "@/hooks/useConversions";
import { RequestFailed, convertDocument, downloadUrlFor } from "@/lib/api";
import { makeId, safeWorkbookName, stripExtension } from "@/lib/format";
import { rememberScope } from "@/lib/scope";
import type { ConversionRecord } from "@/lib/types";

type Run =
  | { state: "idle" }
  | { state: "running"; startedAt: number }
  | {
      state: "done";
      startedAt: number;
      record: ConversionRecord;
      /** Filename the document answers to in Ask, or null if it was not indexed. */
      indexedAs: string | null;
    }
  | { state: "failed"; startedAt: number; title: string; detail?: string };

export default function ConvertPage() {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [touched, setTouched] = useState(false);
  const [run, setRun] = useState<Run>({ state: "idle" });
  const { add } = useConversions();
  const abort = useRef<AbortController | null>(null);

  useEffect(() => () => abort.current?.abort(), []);

  const finalName = safeWorkbookName(name, file?.name ?? "");
  const busy = run.state === "running";

  const pick = useCallback(
    (next: File) => {
      setFile(next);
      setRun({ state: "idle" });
      // Suggest the source name, but never overwrite something typed.
      if (!touched) setName(stripExtension(next.name).slice(0, 80));
    },
    [touched],
  );

  const submit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (!file || !finalName || busy) return;

      const startedAt = Date.now();
      const controller = new AbortController();
      abort.current = controller;
      setRun({ state: "running", startedAt });

      try {
        await convertDocument(file, finalName, controller.signal);
        const record: ConversionRecord = {
          id: makeId(),
          name: finalName,
          source: file.name,
          sizeBytes: file.size,
          savedAt: `excel_files/${finalName}.xlsx`,
          at: Date.now(),
        };
        add(record);
        setRun({ state: "done", startedAt, record });
      } catch (error) {
        if (controller.signal.aborted) {
          setRun({ state: "idle" });
          return;
        }
        setRun({
          state: "failed",
          startedAt,
          title: error instanceof RequestFailed ? error.message : "The conversion could not be sent.",
          detail:
            error instanceof RequestFailed
              ? error.detail
              : "Check that the backend is running and reachable.",
        });
      } finally {
        abort.current = null;
      }
    },
    [add, busy, file, finalName],
  );

  /* A live region has to be in the DOM *before* its content changes — one
     inserted together with its text is not announced at all. So the region is
     mounted from the first render and only the sentence inside it changes. */
  const spoken =
    run.state === "running"
      ? "Converting. This runs as one request and can take a few minutes."
      : run.state === "done"
        ? `Workbook written: ${run.record.name}.xlsx. A download link is now available.`
        : run.state === "failed"
          ? `Conversion stopped. ${run.title}`
          : "";

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-7">
      <p className="sr-only" role="status">
        {spoken}
      </p>

      <header>
        <p className="eyebrow">Convert</p>
        <h1 className="t-h2 mt-3">Document in, workbook out.</h1>
        <p className="t-body mt-3 max-w-xl">
          One table per worksheet, everything else on a Metadata sheet. Values are carried across
          exactly as they were written — including anything the OCR got wrong.
        </p>
      </header>

      <form onSubmit={submit} className="flex flex-col gap-5">
        <Dropzone file={file} onPick={pick} onClear={() => setFile(null)} disabled={busy} />

        <div>
          <label htmlFor="workbook-name" className="label">
            Workbook name
          </label>
          <div className="flex items-stretch gap-2">
            <input
              id="workbook-name"
              className="input"
              value={name}
              disabled={busy}
              placeholder={file ? stripExtension(file.name) : "sunrise-media-invoice"}
              onChange={(event) => {
                setTouched(true);
                setName(event.target.value);
              }}
              spellCheck={false}
              autoComplete="off"
            />
            <span className="t-data grid flex-none place-items-center rounded-md border border-rule-2 bg-bg-3 px-3 text-fg-3">
              .xlsx
            </span>
          </div>
          <p className="t-data mt-2 text-fg-3">
            {finalName ? (
              <>
                Saves as <span className="text-fg">{finalName}.xlsx</span>. Converting again with
                the same name overwrites the previous file.
              </>
            ) : (
              "Characters a filesystem cannot take are stripped automatically."
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={!file || !finalName || busy} className="btn btn-primary">
            {busy ? (
              <>
                <span className="spinner" aria-hidden />
                Converting
              </>
            ) : (
              <>
                <UploadIcon size={17} />
                Convert to Excel
              </>
            )}
          </button>

          {busy ? (
            <button
              type="button"
              onClick={() => abort.current?.abort()}
              className="btn btn-quiet btn-sm"
            >
              Cancel
            </button>
          ) : null}

          {!busy && file ? (
            <p className="t-data text-fg-3">
              Nothing is uploaded until you press this.
            </p>
          ) : null}
        </div>
      </form>

      {run.state === "running" || run.state === "failed" ? (
        <PipelineProgress state={run.state} startedAt={run.startedAt} />
      ) : null}

      {run.state === "failed" ? (
        <Notice
          title={run.title}
          detail={run.detail}
          action={
            <Link href="/app/settings" className="btn btn-outline btn-sm">
              Check the connection
            </Link>
          }
        />
      ) : null}

      {run.state === "done" ? (
        <div className="card overflow-hidden">
          <div className="field-lime flex items-center gap-3 px-5 py-3.5">
            <SheetIcon size={18} />
            <p className="text-[0.9375rem] font-semibold">Workbook written</p>
          </div>
          <div className="p-5 sm:p-6">
            <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
              <div>
                <dt className="label mb-1">File</dt>
                <dd className="t-data break-all text-fg">{run.record.name}.xlsx</dd>
              </div>
              <div>
                <dt className="label mb-1">From</dt>
                <dd className="t-data break-all text-fg">{run.record.source}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="label mb-1">On the server</dt>
                <dd className="t-data break-all text-fg-3">{run.record.savedAt}</dd>
              </div>
            </dl>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={downloadUrlFor(run.record.name)}
                className="btn btn-primary"
                download={`${run.record.name}.xlsx`}
              >
                <DownloadIcon size={17} />
                Download the workbook
              </a>
              <Link href="/app/chat" className="btn btn-outline">
                Ask about it
              </Link>
              <button
                type="button"
                className="btn btn-quiet"
                onClick={() => {
                  setFile(null);
                  setName("");
                  setTouched(false);
                  setRun({ state: "idle" });
                }}
              >
                Convert another
              </button>
            </div>

            <p className="t-data mt-5 border-t border-rule pt-4 text-fg-3">
              Retrieval reads from the extracted Markdown, and the FAISS store is built once and
              then cached. If a brand-new document does not turn up in Ask, rebuild the index —
              Settings explains how.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

"use client";

import { useCallback, useState } from "react";
import { useHealth } from "@/components/app/HealthPill";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { RefreshIcon } from "@/components/ui/Icons";
import { Notice } from "@/components/ui/Notice";
import { RequestFailed, reindex } from "@/lib/api";

const ENDPOINTS = [
  ["POST", "/excel/generate", "file · excel_filename (query param)"],
  ["GET", "/excel/download/{filename}", "filename"],
  ["POST", "/query", "query · source (query params)"],
  ["GET", "/query/documents", "—"],
  ["POST", "/query/reindex", "—"],
  ["GET", "/", "—"],
];

type Rebuild =
  | { state: "idle" }
  | { state: "running" }
  | { state: "done"; chunks: number; documents: number }
  | { state: "failed"; title: string; detail?: string };

export default function SettingsPage() {
  const { health, target, refresh } = useHealth();
  const [rebuild, setRebuild] = useState<Rebuild>({ state: "idle" });

  const rebuildIndex = useCallback(async () => {
    setRebuild({ state: "running" });
    try {
      const result = await reindex();
      setRebuild({ state: "done", chunks: result.chunks, documents: result.documents });
    } catch (error) {
      setRebuild({
        state: "failed",
        title: error instanceof RequestFailed ? error.message : "The rebuild could not be started.",
        detail:
          error instanceof RequestFailed
            ? error.detail
            : "Check that the backend is running and reachable.",
      });
    }
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <header>
        <p className="eyebrow">Settings</p>
        <h1 className="t-h2 mt-3">Where this app is pointed.</h1>
        <p className="t-body mt-3 max-w-xl">
          Nothing here is stored on a server. The backend address comes from this app&rsquo;s own
          environment, and the theme lives in your browser.
        </p>
      </header>

      <section className="card p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="label mb-1">Backend</p>
            <p className="t-data break-all text-fg">
              {target ??
                (health.state === "down"
                  ? "Set by YELLOWDOC_API_URL — the server could not reach it"
                  : "resolving…")}
            </p>
          </div>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => void refresh()}
            disabled={health.state === "checking"}
          >
            {health.state === "checking" ? <span className="spinner" aria-hidden /> : null}
            Check now
          </button>
        </div>

        <div className="mt-5 border-t border-rule pt-5">
          {health.state === "up" ? (
            <Notice
              tone="ok"
              title={`${health.application} ${health.version} responded in ${health.ms}ms`}
              detail="The pipeline and retrieval endpoints are available."
            />
          ) : health.state === "down" ? (
            <Notice title="No answer from the backend" detail={health.reason} />
          ) : (
            <p className="t-small text-fg-3">Checking…</p>
          )}
        </div>

        <p className="t-data mt-5 text-fg-3">
          Change the address with <span className="text-fg">YELLOWDOC_API_URL</span> in{" "}
          <span className="text-fg">web/.env.local</span>, then restart the dev server. Requests are
          proxied server-side, so the backend never needs CORS configured and its address never
          reaches the browser.
        </p>
      </section>

      <section className="card p-5 sm:p-6">
        <p className="label mb-1">Appearance</p>
        <p className="t-small text-fg-2">
          Light is the primary expression — black type on bone paper, lime kept for fields. Dark
          keeps the same roles on an olive-black ground. System follows your operating system.
        </p>
        <div className="mt-4">
          <ThemeToggle />
        </div>
      </section>

      <section className="card p-5 sm:p-6">
        <p className="label mb-1">Retrieval index</p>
        <p className="t-small text-fg-2">
          Every converted document is embedded into the FAISS store as soon as its Markdown is
          written, and the store keeps a manifest of what it holds. If that manifest stops matching{" "}
          <span className="font-mono">md_files/</span> — a file changed, was removed, or was never
          indexed — the next question resynchronises it automatically.
        </p>

        <div className="card-inset mt-4 p-4">
          <p className="label mb-1">Rebuild from scratch</p>
          <p className="t-data text-fg-2">
            Discards the index and re-embeds every file in{" "}
            <span className="text-fg">md_files/</span>. Rarely needed, since the index repairs
            itself — reach for it if the store is corrupt or you changed the embedding model or
            chunk size by hand. On a large corpus this takes a while.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => void rebuildIndex()}
              disabled={rebuild.state === "running"}
            >
              {rebuild.state === "running" ? (
                <>
                  <span className="spinner" aria-hidden />
                  Rebuilding
                </>
              ) : (
                <>
                  <RefreshIcon size={15} />
                  Rebuild the index
                </>
              )}
            </button>
            {/* Mounted from the first render so the result is actually announced;
                a live region inserted together with its text is skipped. */}
            <p className="t-data text-fg-3" role="status">
              {rebuild.state === "running"
                ? "Re-embedding every document. Do not close this tab."
                : rebuild.state === "done"
                  ? `Rebuilt: ${rebuild.chunks} passages from ${rebuild.documents} ${
                      rebuild.documents === 1 ? "document" : "documents"
                    }.`
                  : ""}
            </p>
          </div>
        </div>

        {rebuild.state === "failed" ? (
          <div className="mt-4">
            <Notice title={rebuild.title} detail={rebuild.detail} />
          </div>
        ) : null}
      </section>

      <section className="card overflow-hidden">
        <div className="border-b border-rule px-5 py-4 sm:px-6">
          <p className="label mb-1">Endpoints in use</p>
          <p className="t-small text-fg-3">
            Full interactive documentation is at <span className="font-mono">/docs</span> and{" "}
            <span className="font-mono">/redoc</span> on the running backend.
          </p>
        </div>
        <div className="ws-scroll">
          <table className="ws-table">
            <caption className="sr-only">Backend endpoints this app calls</caption>
            <thead>
              <tr>
                <th scope="col">Method</th>
                <th scope="col">Path</th>
                <th scope="col">Takes</th>
              </tr>
            </thead>
            <tbody>
              {ENDPOINTS.map(([method, path, takes]) => (
                <tr key={`${method} ${path}`}>
                  <td className="font-semibold text-fg">{method}</td>
                  <td className="whitespace-nowrap text-fg">{path}</td>
                  <td>{takes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

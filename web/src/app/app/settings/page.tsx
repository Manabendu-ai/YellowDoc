"use client";

import { useHealth } from "@/components/app/HealthPill";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Notice } from "@/components/ui/Notice";

const ENDPOINTS = [
  ["POST", "/excel/generate", "file · excel_filename (query param)"],
  ["GET", "/excel/download/{filename}", "filename"],
  ["POST", "/query", "query (query param)"],
  ["GET", "/", "—"],
];

export default function SettingsPage() {
  const { health, target, refresh } = useHealth();

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
          The FAISS store is built once, from every Markdown file the extractor has written, the
          first time a question is asked. It is then cached on disk, so documents converted
          afterwards are not searchable until it is rebuilt.
        </p>
        <div className="card-inset mt-4 p-4">
          <p className="label mb-1">To rebuild it</p>
          <p className="t-data text-fg-2">
            Delete <span className="text-fg">faiss_store/</span> on the backend machine and ask a
            question again. The next query re-reads <span className="text-fg">md_files/</span> and
            re-embeds everything.
          </p>
        </div>
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

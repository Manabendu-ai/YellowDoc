/**
 * Browser-side client. Everything goes to this app's own /api/* routes, which
 * proxy the FastAPI backend server-side — so the backend needs no CORS setup
 * and its address never reaches the client bundle.
 */

import { isApiError } from "@/lib/types";
import type {
  ConvertResult,
  IndexedDocument,
  RagResponse,
  ReindexResult,
} from "@/lib/types";

/** Thrown for anything the interface should show the person. */
export class RequestFailed extends Error {
  readonly detail?: string;
  readonly status: number;

  constructor(message: string, status: number, detail?: string) {
    super(message);
    this.name = "RequestFailed";
    this.status = status;
    this.detail = detail;
  }
}

async function unwrap<T>(res: Response): Promise<T> {
  const text = await res.text();
  let body: unknown = undefined;

  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = undefined;
    }
  }

  if (!res.ok) {
    throw isApiError(body)
      ? new RequestFailed(body.error, res.status, body.detail)
      : new RequestFailed(`Request failed (${res.status}).`, res.status, text.slice(0, 300));
  }

  /* A 2xx with an empty or unparseable body would otherwise hand the caller
     `undefined` and crash on the first property read. */
  if (body === undefined) {
    throw new RequestFailed("The backend returned a response this app could not read.", res.status);
  }

  return body as T;
}

export type HealthPayload = {
  application: string;
  version: string;
  ms: number;
  target: string;
};

export async function checkHealth(): Promise<HealthPayload> {
  const res = await fetch("/api/health", { cache: "no-store" });
  return unwrap<HealthPayload>(res);
}

/**
 * Ask a question.
 *
 * `source` is a filename from {@link listDocuments}. Passing it restricts
 * retrieval to that one document; omitting it searches everything.
 */
export async function askQuestion(
  query: string,
  source?: string | null,
  signal?: AbortSignal,
): Promise<RagResponse> {
  const res = await fetch("/api/query", {
    method: "POST",
    headers: { "content-type": "application/json" },
    /* `source: undefined` disappears in JSON.stringify, which is what we want —
       the route handler treats absent and empty alike as "all documents". */
    body: JSON.stringify({ query, source: source || undefined }),
    signal,
  });
  return unwrap<RagResponse>(res);
}

/** What the search index can currently see. Drives the document picker. */
export async function listDocuments(signal?: AbortSignal): Promise<IndexedDocument[]> {
  const res = await fetch("/api/documents", { cache: "no-store", signal });
  const body = await unwrap<{ documents: IndexedDocument[]; count: number }>(res);
  return body.documents ?? [];
}

/** Rebuild the index from md_files/. The manual escape hatch in Settings. */
export async function reindex(signal?: AbortSignal): Promise<ReindexResult> {
  const res = await fetch("/api/reindex", { method: "POST", signal });
  return unwrap<ReindexResult>(res);
}

export async function convertDocument(
  file: File,
  workbookName: string,
  signal?: AbortSignal,
): Promise<ConvertResult> {
  const body = new FormData();
  body.append("file", file);
  body.append("excel_filename", workbookName);

  const res = await fetch("/api/convert", { method: "POST", body, signal });
  return unwrap<ConvertResult>(res);
}

export function downloadUrlFor(workbookName: string): string {
  return `/api/download/${encodeURIComponent(workbookName)}`;
}

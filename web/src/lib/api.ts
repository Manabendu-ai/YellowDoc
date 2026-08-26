/**
 * Browser-side client. Everything goes to this app's own /api/* routes, which
 * proxy the FastAPI backend server-side — so the backend needs no CORS setup
 * and its address never reaches the client bundle.
 */

import { isApiError } from "@/lib/types";
import type { ConvertResult, RagResponse } from "@/lib/types";

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

export async function askQuestion(query: string, signal?: AbortSignal): Promise<RagResponse> {
  const res = await fetch("/api/query", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query }),
    signal,
  });
  return unwrap<RagResponse>(res);
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

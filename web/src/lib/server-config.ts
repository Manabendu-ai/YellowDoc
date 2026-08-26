/**
 * Server-only backend configuration.
 *
 * The FastAPI app does not install CORSMiddleware, so the browser cannot call
 * it directly. Every request goes through a Next route handler in
 * src/app/api/*, which talks to the backend server-side. That also keeps the
 * backend host out of the client bundle.
 */

export const API_URL = (process.env.YELLOWDOC_API_URL ?? "http://localhost:8000").replace(
  /\/+$/,
  "",
);

/**
 * Layout analysis plus LLM structuring on a long scan takes minutes.
 *
 * `||` rather than `??` on purpose: a declared-but-empty env var gives
 * `Number("")` === 0, and a typo gives NaN — either would make
 * `AbortSignal.timeout` fire immediately and cancel every conversion.
 */
export const CONVERT_TIMEOUT_MS =
  Number(process.env.YELLOWDOC_CONVERT_TIMEOUT_MS) || 10 * 60 * 1000;

/**
 * The first question is the expensive one: RAGSearch builds the whole FAISS
 * index from md_files/ when the store is missing, which can run for minutes.
 * Kept just under the route's own maxDuration of 300s.
 */
export const QUERY_TIMEOUT_MS = 290_000;
export const HEALTH_TIMEOUT_MS = 6_000;

/** Turn whatever went wrong into something the interface can say out loud. */
export function describeFetchFailure(err: unknown): string {
  if (err instanceof DOMException && err.name === "AbortError") {
    return "The backend did not respond in time.";
  }
  const cause = (err as { cause?: { code?: string } } | undefined)?.cause;
  if (cause?.code === "ECONNREFUSED") {
    return `Nothing is listening on ${API_URL}. Start the backend with: uvicorn backend.main:app --port 8000`;
  }
  if (cause?.code === "ENOTFOUND" || cause?.code === "EAI_AGAIN") {
    return `Could not resolve ${API_URL}. Check YELLOWDOC_API_URL.`;
  }
  return err instanceof Error ? err.message : "The backend could not be reached.";
}

/**
 * FastAPI reports problems as `{"detail": …}`, where `detail` is either a
 * string or a list of validation objects. Flatten it into one line.
 */
export async function readBackendError(res: Response): Promise<string> {
  const body = await res.text();
  if (!body) return `Backend responded ${res.status}.`;
  try {
    const parsed = JSON.parse(body) as { detail?: unknown };
    const detail = parsed.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      return detail
        .map((item) => {
          const entry = item as { loc?: unknown[]; msg?: string };
          const where = Array.isArray(entry.loc) ? entry.loc.join(" → ") : "";
          return [where, entry.msg].filter(Boolean).join(": ");
        })
        .filter(Boolean)
        .join("; ");
    }
    return body.slice(0, 400);
  } catch {
    return body.slice(0, 400);
  }
}

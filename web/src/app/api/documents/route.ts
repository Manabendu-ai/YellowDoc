import { NextResponse } from "next/server";
import {
  API_URL,
  QUERY_TIMEOUT_MS,
  describeFetchFailure,
  readBackendError,
} from "@/lib/server-config";
import type { IndexedDocument } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * GET /api/documents — proxies `GET /query/documents`.
 *
 * The first call can be slow: the backend brings the FAISS index in line with
 * md_files/ before answering, which means embedding anything newly converted.
 * That is why this shares the query timeout rather than the health one.
 */
export async function GET() {
  try {
    const res = await fetch(`${API_URL}/query/documents`, {
      headers: { accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(QUERY_TIMEOUT_MS),
    });

    if (!res.ok) {
      return NextResponse.json(
        {
          error: "Could not read the list of searchable documents.",
          detail: await readBackendError(res),
        },
        { status: res.status },
      );
    }

    const raw = (await res.json()) as { documents?: unknown };

    /* Filtered rather than mapped: an entry without a filename cannot be used as
       a scope, so it would be a picker option that silently fails. */
    const documents: IndexedDocument[] = Array.isArray(raw.documents)
      ? raw.documents.flatMap((item): IndexedDocument[] => {
          if (typeof item !== "object" || item === null) return [];
          const entry = item as Partial<IndexedDocument>;
          if (typeof entry.source !== "string" || !entry.source) return [];
          return [
            {
              source: entry.source,
              document:
                typeof entry.document === "string" && entry.document
                  ? entry.document
                  : entry.source.replace(/\.md$/i, ""),
              chunks: Number.isFinite(entry.chunks) ? Number(entry.chunks) : 0,
              indexed_at: Number.isFinite(entry.indexed_at) ? Number(entry.indexed_at) : null,
            },
          ];
        })
      : [];

    return NextResponse.json({ documents, count: documents.length });
  } catch (err) {
    return NextResponse.json({ error: describeFetchFailure(err) }, { status: 502 });
  }
}

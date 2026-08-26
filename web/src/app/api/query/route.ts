import { NextResponse } from "next/server";
import {
  API_URL,
  QUERY_TIMEOUT_MS,
  describeFetchFailure,
  readBackendError,
} from "@/lib/server-config";
import type { RagResponse, RagSource } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Trust nothing about the shape of `sources`; the citation list drives the UI. */
function normaliseSources(value: unknown): RagSource[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item): RagSource[] => {
    if (typeof item !== "object" || item === null) return [];
    const entry = item as Partial<RagSource>;
    const excerpt = typeof entry.excerpt === "string" ? entry.excerpt : "";
    if (!excerpt) return [];
    return [
      {
        document: typeof entry.document === "string" ? entry.document : "unknown",
        source: typeof entry.source === "string" ? entry.source : "unknown",
        chunk: Number.isFinite(entry.chunk) ? Number(entry.chunk) : 0,
        score: Number.isFinite(entry.score) ? Number(entry.score) : 0,
        excerpt,
      },
    ];
  });
}

function stringsOnly(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

/**
 * POST /api/query  { query: string, source?: string }
 *
 * The backend takes both as query-string parameters, not a body, so this route
 * accepts a normal JSON body from the browser and rewrites it.
 *
 * `source` is a filename from GET /api/documents. When present, retrieval is
 * restricted to that one document — without it, a question about one invoice
 * can be answered from a near-identical one.
 */
export async function POST(request: Request) {
  let query = "";
  let source = "";

  try {
    const body = (await request.json()) as { query?: unknown; source?: unknown };
    query = typeof body.query === "string" ? body.query.trim() : "";
    source = typeof body.source === "string" ? body.source.trim() : "";
  } catch {
    return NextResponse.json(
      { error: "Send a JSON body shaped { query, source? }." },
      { status: 400 },
    );
  }

  if (!query) {
    return NextResponse.json({ error: "Type a question first." }, { status: 400 });
  }

  /* Built conditionally: sending `source=` empty would make FastAPI scope the
     search to a document literally named "", which matches nothing. */
  const params = new URLSearchParams({ query });
  if (source) params.set("source", source);
  const target = `${API_URL}/query?${params}`;

  try {
    const res = await fetch(target, {
      method: "POST",
      headers: { accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(QUERY_TIMEOUT_MS),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "The retrieval engine could not answer.", detail: await readBackendError(res) },
        { status: res.status },
      );
    }

    const raw: unknown = await res.json();

    /* Older backends returned a bare string when nothing matched. Normalise it
       so the interface only ever renders one shape. */
    if (typeof raw === "string") {
      return NextResponse.json({
        query,
        answer:
          raw.trim() ||
          "Nothing in the index matches that question yet. Convert a document first, or try different wording.",
        summary: "",
        confidence: "none",
        key_points: [],
        examples: [],
        scope: source || null,
        sources: [],
      } satisfies RagResponse);
    }

    const body = raw as Partial<RagResponse>;

    return NextResponse.json({
      query: body.query ?? query,
      answer: body.answer ?? "",
      summary: body.summary ?? "",
      confidence: body.confidence ?? "",
      key_points: stringsOnly(body.key_points),
      examples: stringsOnly(body.examples),
      /* Echo the request's scope when the backend omits it, so the transcript
         always records what the answer was allowed to see. */
      scope: typeof body.scope === "string" && body.scope ? body.scope : source || null,
      sources: normaliseSources(body.sources),
    } satisfies RagResponse);
  } catch (err) {
    return NextResponse.json({ error: describeFetchFailure(err) }, { status: 502 });
  }
}

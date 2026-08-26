import { NextResponse } from "next/server";
import {
  API_URL,
  QUERY_TIMEOUT_MS,
  describeFetchFailure,
  readBackendError,
} from "@/lib/server-config";
import type { RagResponse } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * POST /api/query  { query: string }
 *
 * The backend takes `query` as a query-string parameter, not a body, so this
 * route accepts a normal JSON body from the browser and rewrites it.
 */
export async function POST(request: Request) {
  let query = "";

  try {
    const body = (await request.json()) as { query?: unknown };
    query = typeof body.query === "string" ? body.query.trim() : "";
  } catch {
    return NextResponse.json({ error: "Send a JSON body shaped { query }." }, { status: 400 });
  }

  if (!query) {
    return NextResponse.json({ error: "Type a question first." }, { status: 400 });
  }

  const target = `${API_URL}/query?${new URLSearchParams({ query })}`;

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

    /* When nothing in the index matches, RAGSearch returns the bare string
       "No Relavant Document Found!" instead of the structured model. Normalise
       it so the interface has one shape to render. */
    if (typeof raw === "string") {
      return NextResponse.json({
        query,
        answer:
          "Nothing in the index matches that question yet. Convert a document first, or try different wording.",
        summary: "",
        confidence: "none",
        key_points: [],
        examples: [],
      } satisfies RagResponse);
    }

    const body = raw as Partial<RagResponse>;

    return NextResponse.json({
      query: body.query ?? query,
      answer: body.answer ?? "",
      summary: body.summary ?? "",
      confidence: body.confidence ?? "",
      key_points: Array.isArray(body.key_points) ? body.key_points : [],
      examples: Array.isArray(body.examples) ? body.examples : [],
    } satisfies RagResponse);
  } catch (err) {
    return NextResponse.json({ error: describeFetchFailure(err) }, { status: 502 });
  }
}

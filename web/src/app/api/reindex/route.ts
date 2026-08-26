import { NextResponse } from "next/server";
import {
  API_URL,
  QUERY_TIMEOUT_MS,
  describeFetchFailure,
  readBackendError,
} from "@/lib/server-config";
import type { ReindexResult } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * POST /api/reindex — proxies `POST /query/reindex`.
 *
 * Discards the index and rebuilds it from every file in md_files/. Normally
 * unnecessary: conversion indexes each document as it is written, and a stale
 * index repairs itself on the next question. This exists for the cases that
 * cannot self-heal — a corrupt store, or a chunk setting changed by hand.
 */
export async function POST() {
  try {
    const res = await fetch(`${API_URL}/query/reindex`, {
      method: "POST",
      headers: { accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(QUERY_TIMEOUT_MS),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "The search index could not be rebuilt.", detail: await readBackendError(res) },
        { status: res.status },
      );
    }

    const body = (await res.json()) as Partial<ReindexResult>;

    return NextResponse.json({
      mode: typeof body.mode === "string" ? body.mode : "rebuild",
      chunks: Number.isFinite(body.chunks) ? Number(body.chunks) : 0,
      documents: Number.isFinite(body.documents) ? Number(body.documents) : 0,
    } satisfies ReindexResult);
  } catch (err) {
    return NextResponse.json({ error: describeFetchFailure(err) }, { status: 502 });
  }
}

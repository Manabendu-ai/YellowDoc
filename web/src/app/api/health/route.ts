import { NextResponse } from "next/server";
import {
  API_URL,
  HEALTH_TIMEOUT_MS,
  describeFetchFailure,
  readBackendError,
} from "@/lib/server-config";
import type { HealthResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

/** GET /api/health — proxies the backend's `GET /` health payload. */
export async function GET() {
  const started = Date.now();

  try {
    const res = await fetch(`${API_URL}/`, {
      cache: "no-store",
      signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "The backend is reachable but unhealthy.", detail: await readBackendError(res) },
        { status: 502 },
      );
    }

    const body = (await res.json()) as HealthResponse;

    return NextResponse.json({
      application: body?.API?.application ?? "unknown",
      version: body?.API?.version ?? "unknown",
      ms: Date.now() - started,
      target: API_URL,
    });
  } catch (err) {
    return NextResponse.json({ error: describeFetchFailure(err) }, { status: 502 });
  }
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { RequestFailed, checkHealth } from "@/lib/api";
import type { HealthState } from "@/lib/types";

/**
 * Shared by the sidebar and Settings. Everything in this app depends on a
 * backend the person has to start themselves, so the connection state is
 * permanently on screen rather than discovered through a failed upload.
 */
export function useHealth(auto = true) {
  const [health, setHealth] = useState<HealthState>({ state: "unknown" });
  /** Which backend the server route is talking to — only it knows. */
  const [target, setTarget] = useState<string | null>(null);

  const run = useCallback(async () => {
    setHealth({ state: "checking" });
    const started = performance.now();
    try {
      const payload = await checkHealth();
      setTarget(payload.target);
      setHealth({
        state: "up",
        application: payload.application,
        version: payload.version,
        ms: payload.ms || Math.round(performance.now() - started),
      });
    } catch (error) {
      setHealth({
        state: "down",
        reason:
          error instanceof RequestFailed
            ? (error.detail ?? error.message)
            : "The check itself could not be sent.",
      });
    }
  }, []);

  useEffect(() => {
    if (auto) void run();
  }, [auto, run]);

  return { health, target, refresh: run };
}

export function HealthPill() {
  const { health, refresh } = useHealth();

  const tone =
    health.state === "up"
      ? "border-ok/35 text-ok"
      : health.state === "down"
        ? "border-bad/35 text-bad"
        : "border-rule-2 text-fg-3";

  const label =
    health.state === "up"
      ? `Backend up · ${health.ms}ms`
      : health.state === "down"
        ? "Backend unreachable"
        : health.state === "checking"
          ? "Checking backend"
          : "Backend unknown";

  return (
    <button
      type="button"
      onClick={() => void refresh()}
      /* The name changes as the check runs, so it is also announced. And the
         "press to re-check" affordance is in the accessible name rather than
         only in `title`, which plenty of screen readers never read out. */
      aria-label={`${label}. Press to check again.`}
      aria-live="polite"
      title={health.state === "down" ? health.reason : "Check again"}
      className={`flex w-full items-center gap-2.5 rounded-md border bg-bg px-3 py-2 text-left transition-colors hover:bg-bg-3 ${tone}`}
    >
      {health.state === "checking" ? (
        <span className="spinner" aria-hidden />
      ) : (
        <span
          className={`dot ${
            health.state === "up" ? "bg-ok" : health.state === "down" ? "bg-bad" : "bg-fg-3"
          }`}
          aria-hidden
        />
      )}
      <span className="t-data truncate">{label}</span>
    </button>
  );
}

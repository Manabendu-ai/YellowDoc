"use client";

import { useEffect, useState } from "react";
import { CheckIcon, CloseIcon } from "@/components/ui/Icons";
import { formatClock } from "@/lib/format";

/**
 * The four real stages of ExcelService.convert(). The backend runs them
 * synchronously and emits no progress events, so which one is highlighted is
 * estimated from elapsed time — stated plainly below rather than dressed up as
 * a percentage we would be inventing.
 */
const STAGES = [
  { name: "Reading the layout", note: "Docling", at: 0 },
  { name: "Structuring the content", note: "gpt-oss-120b · temperature 0", at: 14_000 },
  { name: "Writing the workbook", note: "OpenPyXL", at: 42_000 },
  { name: "Finishing up", note: "saving to excel_files/", at: 54_000 },
];

const LAST = STAGES.length - 1;

/** Success replaces this card entirely, so there is no "done" state here. */
export function PipelineProgress({
  state,
  startedAt,
}: {
  state: "running" | "failed";
  startedAt: number;
}) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (state !== "running") return;
    const tick = () => setElapsed(Date.now() - startedAt);
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [state, startedAt]);

  /* Estimated position. Nothing here ever claims the whole run finished. */
  const reached = STAGES.reduce((best, stage, index) => (elapsed >= stage.at ? index : best), 0);
  const cursor = Math.min(reached, LAST);

  return (
    <div className="card p-5 sm:p-6">
      <div className="flex items-baseline justify-between gap-4">
        {/* Not a live region: this card is inserted at the same moment the run
            starts, and a region that arrives with its content is never
            announced. The convert screen owns one permanent region instead. */}
        <p className="label mb-0">{state === "running" ? "Converting" : "Stopped"}</p>
        <p className="t-data text-fg-3" aria-hidden>
          {formatClock(elapsed)}
        </p>
      </div>

      {state === "running" ? <div className="barber mt-4" /> : null}

      <ol className="mt-3 divide-y divide-rule">
        {STAGES.map((stage, index) => {
          const done = index < cursor;
          const isActive = state === "running" && index === cursor;
          const failed = state === "failed" && index === cursor;

          return (
            <li
              key={stage.name}
              className={`phase ${isActive ? "phase-active" : ""} ${done ? "phase-done" : ""}`}
            >
              <span className={`phase-mark ${failed ? "border-bad text-bad" : ""}`} aria-hidden>
                {done ? (
                  <CheckIcon size={11} />
                ) : failed ? (
                  <CloseIcon size={11} />
                ) : (
                  String(index + 1)
                )}
              </span>
              <span className="min-w-0">
                <span className="phase-name block">{stage.name}</span>
                <span className="phase-note block">{stage.note}</span>
              </span>
            </li>
          );
        })}
      </ol>

      {state === "running" ? (
        <p className="t-data mt-4 border-t border-rule pt-3.5 text-fg-3">
          The pipeline runs as one synchronous request and reports no progress events, so the
          highlighted stage is estimated from elapsed time. A long scan can take several minutes —
          leave this tab open.
        </p>
      ) : null}
    </div>
  );
}

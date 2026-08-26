"use client";

import { confidenceTone } from "@/lib/format";
import type { ChatMessage } from "@/lib/types";

/**
 * A YellowDoc turn is not just prose — the model returns a summary, the key
 * figures it leaned on, and its own confidence. Showing all of it is the point:
 * an answer about a number should carry the number it came from.
 */
export function AnswerDetail({ detail }: { detail: NonNullable<ChatMessage["detail"]> }) {
  const tone = confidenceTone(detail.confidence);
  const hasPoints = detail.key_points.length > 0;
  const hasExamples = detail.examples.length > 0;
  const hasSummary = detail.summary.trim().length > 0;

  if (!hasPoints && !hasExamples && !hasSummary && !detail.confidence.trim()) return null;

  return (
    <div className="mt-4 flex flex-col gap-4 border-t border-rule pt-4">
      {hasSummary ? (
        <div>
          <p className="label">Summary</p>
          <p className="t-small text-fg-2">{detail.summary}</p>
        </div>
      ) : null}

      {hasPoints ? (
        <div>
          <p className="label">Key points</p>
          <ul className="flex flex-col gap-1.5">
            {detail.key_points.map((point, index) => (
              <li key={`${index}-${point}`} className="t-data flex gap-2.5 text-fg-2">
                <span className="dot mt-1.5 flex-none bg-clay" aria-hidden />
                <span className="min-w-0 break-words">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {hasExamples ? (
        <div>
          <p className="label">Quoted from the documents</p>
          <ul className="flex flex-col gap-1.5">
            {detail.examples.map((example, index) => (
              <li
                key={`${index}-${example}`}
                className="t-data rounded-md border-l-2 border-rule-2 bg-bg-3 px-3 py-2 break-words text-fg-2"
              >
                {example}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {detail.confidence.trim() ? (
        <div>
          <span className={`tag${tone === "flat" ? "" : ` tag-${tone}`}`}>
            confidence · {detail.confidence.trim().toLowerCase()}
          </span>
        </div>
      ) : null}
    </div>
  );
}

"use client";

import { confidenceTone } from "@/lib/format";
import type { ChatMessage, RagSource } from "@/lib/types";

/**
 * A YellowDoc turn is not just prose — the model returns a summary, the key
 * figures it leaned on, and its own confidence. Showing all of it is the point:
 * an answer about a number should carry the number it came from.
 *
 * The passage list is the part that makes a wrong answer visible. It is attached
 * by the backend from what retrieval actually returned, not asked of the model,
 * so if an answer was assembled from the wrong invoice the filename says so.
 */
export function AnswerDetail({ detail }: { detail: NonNullable<ChatMessage["detail"]> }) {
  const tone = confidenceTone(detail.confidence);
  const hasPoints = detail.key_points.length > 0;
  const hasExamples = detail.examples.length > 0;
  const hasSummary = detail.summary.trim().length > 0;

  /* Threads saved before scoping existed have neither field, and localStorage
     hands them back untyped — so these two cannot be trusted to be present. */
  const sources: RagSource[] = Array.isArray(detail.sources) ? detail.sources : [];
  const scope = typeof detail.scope === "string" ? detail.scope : null;

  if (
    !hasPoints &&
    !hasExamples &&
    !hasSummary &&
    sources.length === 0 &&
    !detail.confidence.trim()
  ) {
    return null;
  }

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

      {sources.length > 0 ? (
        <details>
          {/* `.label` sets display:block, which hides the disclosure marker in
              Chrome when applied to the summary itself — hence the inner span. */}
          <summary className="cursor-pointer text-fg-3">
            <span className="label mb-0 inline">
              Passages retrieved ({sources.length})
            </span>
          </summary>
          <ul className="mt-3 flex flex-col gap-2">
            {sources.map((source) => (
              <li
                key={`${source.source}-${source.chunk}`}
                className="rounded-md border border-rule-2 bg-bg-3 px-3 py-2"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="tag tag-clay">{source.document}</span>
                  <span className="t-data text-fg-3">
                    passage {source.chunk} · similarity {source.score.toFixed(3)}
                  </span>
                </div>
                <p className="t-data mt-2 max-h-28 overflow-auto break-words whitespace-pre-wrap text-fg-2">
                  {source.excerpt}
                </p>
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {detail.confidence.trim() ? (
          <span className={`tag${tone === "flat" ? "" : ` tag-${tone}`}`}>
            confidence · {detail.confidence.trim().toLowerCase()}
          </span>
        ) : null}
        <span className="tag">{scope ? `scoped to ${scope}` : "all documents"}</span>
      </div>
    </div>
  );
}

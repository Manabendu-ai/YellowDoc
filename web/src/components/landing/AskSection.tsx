import Link from "next/link";
import { ArrowRightIcon } from "@/components/ui/Icons";
import { Reveal } from "@/components/ui/Reveal";

/**
 * A real exchange in the same bubbles the app uses, including the refusal —
 * because "it tells you when it doesn't know" is the feature, not a caveat.
 */
export function AskSection() {
  return (
    <section id="ask" className="band scroll-mt-20">
      <div className="shell grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
        <div>
          <p className="eyebrow">Retrieval</p>
          <h2 className="t-h2 mt-5">Then ask it things.</h2>
          <p className="t-lead mt-5">
            Everything you convert is kept as layout-preserving Markdown, and that is what retrieval
            searches. Answers are drawn from your documents and nothing else — figures quoted
            exactly as they appear, and a plain refusal when the answer is not in there.
          </p>
          <p className="t-body mt-4">
            Each answer arrives with a summary, the key figures it relied on, and how confident the
            model was. When retrieval comes back empty, it says so rather than filling the gap.
          </p>
          <Link href="/app/chat" className="btn btn-outline mt-7">
            Ask about your documents
            <ArrowRightIcon size={17} />
          </Link>
        </div>

        <Reveal>
          <div className="card p-4 sm:p-6">
            <div className="flex flex-col gap-4">
              <div className="bubble bubble-you">
                <p className="text-[0.9375rem] leading-snug">
                  What&rsquo;s the grand total on the Sunrise Media invoice, and does it match the
                  line items?
                </p>
              </div>

              <div className="bubble bubble-yd">
                <p className="prose-answer">
                  The invoice states a GRAND TOTAL of 1.973.26. The line item amounts on the sheet
                  are 7.58, an empty value, and 1.973.26 — so the stated total equals the third
                  line item on its own and does not sum the rows above it. Both figures are
                  reproduced exactly as written.
                </p>

                <div className="mt-4 border-t border-rule pt-3.5">
                  <p className="label">Key points</p>
                  <ul className="flex flex-col gap-1.5">
                    {[
                      "GRAND TOTAL as written: 1.973.26",
                      "Line items: 7.58 · (empty) · 1.973.26",
                      "The stated total does not sum the rows above it",
                    ].map((point) => (
                      <li key={point} className="t-data flex gap-2.5 text-fg-2">
                        <span className="dot mt-1.5 bg-clay" aria-hidden />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3.5 flex items-center gap-2">
                    <span className="tag tag-ok">confidence · high</span>
                    <span className="tag">3 chunks retrieved</span>
                  </div>
                </div>
              </div>

              <div className="bubble bubble-you">
                <p className="text-[0.9375rem] leading-snug">And what was the VAT rate?</p>
              </div>

              <div className="bubble bubble-yd">
                <p className="prose-answer">
                  The uploaded documents do not contain enough information to answer this question.
                </p>
                <div className="mt-3.5">
                  <span className="tag tag-bad">confidence · none</span>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

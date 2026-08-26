import { Reveal } from "@/components/ui/Reveal";

/**
 * The thesis section. Each rule is a real instruction from
 * backend/llm/system_message.py, demonstrated with a value from the sample
 * invoice — and the demonstration works precisely because the two lines are
 * identical.
 */
const RULES: { rule: string; value: string; why: string }[] = [
  {
    rule: "Typos stay typos",
    value: "Noles being laken",
    why: "OCR misreads are preserved exactly. A silently corrected word is a changed record, and you would have no way to know it happened.",
  },
  {
    rule: "Expressions are not evaluated",
    value: "1.800+3.79",
    why: "If the page shows an unresolved sum, so does the cell. Nothing is computed that the document did not already state itself.",
  },
  {
    rule: "Numbers are not reformatted",
    value: "1.973.26",
    why: "Ambiguous separators are left ambiguous. No rounding, no thousands separators, no guess about which dot was meant to be the decimal.",
  },
  {
    rule: "Totals are never checked",
    value: "GRAND TOTAL  1.973.26",
    why: "A total that disagrees with its line items is reported as written. Reconciling is your call to make, on your terms.",
  },
];

export function Fidelity() {
  return (
    <section id="fidelity" className="band scroll-mt-20">
      <div className="shell">
        <div className="max-w-3xl">
          <p className="eyebrow">Fidelity</p>
          <h2 className="t-h2 mt-5">The engine is not allowed to help.</h2>
          <p className="t-lead mt-5">
            Most extraction tools quietly tidy up what they read — a spelling fixed here, a total
            recalculated there. This one is instructed not to. Four rules it never breaks:
          </p>
        </div>

        <ul className="mt-12 grid gap-4 md:grid-cols-2">
          {RULES.map((item, index) => (
            /* h-full has to travel down every level between the grid item and
               the card, including Reveal's own wrapper, or the cards in a row
               stop matching heights. */
            <li key={item.rule}>
              <Reveal delay={index * 70} className="h-full">
                <article className="card card-hover flex h-full flex-col p-6">
                  <h3 className="t-h4">{item.rule}</h3>

                  <div className="card-inset mt-4 divide-y divide-rule">
                    <div className="flex items-baseline gap-3 px-3.5 py-2.5">
                      <span className="label mb-0 w-[7.5rem] flex-none">On the page</span>
                      <span className="t-data text-fg">{item.value}</span>
                    </div>
                    <div className="flex items-baseline gap-3 px-3.5 py-2.5">
                      <span className="label mb-0 w-[7.5rem] flex-none">In the cell</span>
                      <span className="t-data text-fg">{item.value}</span>
                      <span className="tag tag-clay ml-auto">unchanged</span>
                    </div>
                  </div>

                  <p className="t-small mt-4">{item.why}</p>
                </article>
              </Reveal>
            </li>
          ))}
        </ul>

        <Reveal delay={140}>
          <p className="t-small mt-8 max-w-2xl text-fg-3">
            Ragged rows follow the same principle: a row missing its trailing cells keeps its
            position and gets empty strings, so columns never shift to close a gap. Empty means
            empty — never <span className="t-data">null</span>.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

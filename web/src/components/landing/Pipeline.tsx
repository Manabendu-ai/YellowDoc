import { BrainIcon, IndexIcon, ScanIcon, SheetIcon } from "@/components/ui/Icons";
import { Reveal } from "@/components/ui/Reveal";

/**
 * Numbered because it genuinely is a sequence — each pass consumes the
 * previous pass's output, and the order is load-bearing information.
 */
const PHASES = [
  {
    name: "Parse the page",
    Icon: ScanIcon,
    engines: ["IBM Docling", "markdown"],
    body: "Docling finds the layout — table borders, headings, letterhead blocks, body text — and writes it out as layout-preserving Markdown. One converter handles the lot, so a digital PDF, a DOCX and a photographed receipt all end up in the same shape.",
  },
  {
    name: "Structure the content",
    Icon: BrainIcon,
    engines: ["Groq", "gpt-oss-120b", "temperature 0"],
    body: "The Markdown goes to the structuring agent under a schema-locked prompt. Each logical table becomes its own worksheet; everything that is not part of a table becomes key-value rows on a Metadata sheet. Every cell comes back as a string, so nothing is coerced into a number the document never wrote.",
  },
  {
    name: "Synthesize the workbook",
    Icon: SheetIcon,
    engines: ["OpenPyXL", "xlsx"],
    body: "The validated JSON becomes a real workbook: one sheet per table, header row filled and frozen, auto-filter applied, column widths fitted to the longest value. Sheet names are truncated to Excel's 31-character limit and de-duplicated rather than merged.",
  },
  {
    name: "Index it for questions",
    Icon: IndexIcon,
    engines: ["all-MiniLM-L6-v2", "FAISS"],
    body: "The layout-preserving Markdown from pass one is also what retrieval reads. The first question you ask chunks every converted document, embeds it, and writes a local FAISS store — which is what makes the chat able to quote your own invoice numbers back at you instead of describing invoices in general.",
  },
];

export function Pipeline() {
  return (
    <section id="pipeline" className="ledger band scroll-mt-20">
      <div className="shell">
        <div className="max-w-3xl">
          <p className="eyebrow">The pipeline</p>
          <h2 className="t-h2 mt-5">Four passes over one page.</h2>
          <p className="t-lead mt-5">
            Nothing here is a single model call. Layout, meaning, format, and retrieval are
            separate problems, so they get separate passes.
          </p>
        </div>

        <ol className="mt-12 border-t border-rule">
          {PHASES.map((phase, index) => (
            <li key={phase.name} className="border-b border-rule">
              <Reveal delay={index * 60}>
                <div className="grid gap-4 py-7 md:grid-cols-[3.5rem_1fr] md:gap-8 lg:grid-cols-[3.5rem_20rem_1fr]">
                  <div className="flex items-start gap-3 md:flex-col md:gap-4">
                    <span className="t-data leading-none font-semibold text-clay-ink">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="text-fg-3 md:mt-1">
                      <phase.Icon size={20} />
                    </span>
                  </div>

                  <div>
                    <h3 className="t-h3">{phase.name}</h3>
                    <ul className="mt-3 flex flex-wrap gap-1.5">
                      {phase.engines.map((engine) => (
                        <li key={engine}>
                          <span className="tag">{engine}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <p className="t-body max-w-2xl">{phase.body}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/**
 * THE TRANSFORM — the hero's signature element.
 *
 * A real OCR'd invoice fragment resolving into a workbook, in the same order
 * the pipeline actually runs: read the page, structure it, fill the header,
 * lock the cells, name the sheets, then flag what was preserved verbatim.
 *
 * The content is not decorative. Every artifact on the left is one the engine
 * is specifically instructed not to fix (backend/llm/system_message.py):
 * the OCR misread "Noles being laken", the unresolved "1.800+3.79", the
 * ragged row with two empty trailing cells, and a total that does not add up.
 * They all survive to the right-hand side unchanged. That is the product.
 */

const SOURCE_LINES: { text: string; strong?: boolean }[] = [
  { text: "## SUNRISE MEDIA AGENCY", strong: true },
  { text: "14 Bridge Road, Leeds LS1 4AP" },
  { text: "Tel 0113 496 0182 · sunrisemedia.co.uk" },
  { text: "" },
  { text: "Name          Ridgeway Consulting Ltd" },
  { text: "Date          04/08/2026" },
  { text: "Invoice No.   SM-20 26 -0418" },
  { text: "" },
  { text: "| Description | Time Spent | Price | Total |", strong: true },
  { text: "| Image capture & record | 2 hours | 7.58 | 7.58 |" },
  { text: "| Noles being laken | 20 mins |  |  |" },
  { text: "| Transcription | 1.5 hours | 1.800+3.79 | 1.973.26 |" },
  { text: "| GRAND TOTAL |  |  | 1.973.26 |" },
  { text: "" },
  { text: "<!-- image -->" },
  { text: "Sub Total     1.973.26" },
];

const PHASES = [
  { label: "Parse", note: "Docling" },
  { label: "Structure", note: "gpt-oss-120b" },
  { label: "Synthesize", note: "OpenPyXL" },
  { label: "Index", note: "FAISS" },
];

const COLUMNS = ["Description", "Time Spent", "Price (£ xtime)", "Total (£)"];

type Cell = { value: string; num?: boolean; kept?: string };

const ROWS: Cell[][] = [
  [
    { value: "Image capture & record of meetings" },
    { value: "2 hours" },
    { value: "7.58", num: true },
    { value: "7.58", num: true },
  ],
  [
    { value: "Noles being laken", kept: "typo kept" },
    { value: "20 mins" },
    { value: "", num: true },
    { value: "", num: true },
  ],
  [
    { value: "Transcription & write-up" },
    { value: "1.5 hours" },
    { value: "1.800+3.79", num: true, kept: "not evaluated" },
    { value: "1.973.26", num: true },
  ],
  [
    { value: "GRAND TOTAL" },
    { value: "" },
    { value: "", num: true },
    { value: "1.973.26", num: true },
  ],
];

/* The sequence is CSS-timed; these are the delays the TSX contributes, and they
   are tuned against the keyframe delays in globals.css (.xf-line, .xf-node,
   .xf-sheet th, .xf-flag, .xf-foot). Change one side and check the other. */
const LINE_STEP = 0.045;
const SPINE_BASE = 0.85;
const HEAD_BASE = 1.25;
const CELL_BASE = 1.45;

export function Transform() {
  return (
    /* role="img" collapses the whole composition into one description. That is
       deliberate: it is a looping illustration of a document turning into a
       workbook, and reading forty cells of sample data aloud would be worse
       than reading the sentence. The prose beside it makes the same point. */
    <div className="xf" role="img" aria-label="A scanned invoice being rebuilt as a workbook">
      {/* ---------- what came in ---------- */}
      <figure className="xf-panel m-0">
        <div className="xf-head">
          <span className="xf-name">invoice_sm-2026-0418.pdf</span>
          <span className="tag">scanned · 1 page</span>
        </div>
        <div className="xf-body">
          <div className="xf-scan" aria-hidden />
          {SOURCE_LINES.map((line, index) => (
            <div
              key={index}
              className={`xf-line${line.strong ? " xf-line-strong" : ""}`}
              style={{ animationDelay: `${0.2 + index * LINE_STEP}s` }}
            >
              {line.text || " "}
            </div>
          ))}
        </div>
      </figure>

      {/* ---------- what happens in between ---------- */}
      <div className="xf-spine" aria-hidden>
        {PHASES.map((phase, index) => (
          <div key={phase.label} className="contents">
            {index > 0 ? <span className="xf-thread" /> : null}
            <div
              className="xf-node"
              style={{ animationDelay: `${SPINE_BASE + index * 0.1}s` }}
              title={phase.note}
            >
              <span className="xf-node-mark" />
              <span className="xf-node-label">{phase.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ---------- what came out ---------- */}
      <figure className="xf-panel xf-panel-out m-0">
        <div className="xf-head">
          <span className="xf-name">invoice_sm-2026-0418.xlsx</span>
          <span className="tag tag-clay">invoice</span>
        </div>

        <div className="xf-body xf-body-flush">
          <table className="xf-sheet">
            <thead>
              <tr>
                {COLUMNS.map((column, columnIndex) => (
                  <th
                    key={column}
                    scope="col"
                    style={{ animationDelay: `${HEAD_BASE + columnIndex * 0.05}s` }}
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, columnIndex) => (
                    <td
                      key={columnIndex}
                      className={[
                        cell.num ? "xf-num" : "",
                        cell.kept ? "xf-kept" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      style={{
                        animationDelay: `${CELL_BASE + rowIndex * 0.09 + columnIndex * 0.035}s`,
                      }}
                    >
                      {cell.value || <span className="ws-empty">—</span>}
                      {cell.kept ? <span className="xf-flag">{cell.kept}</span> : null}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Decorative: a picture of a workbook's tabs, not a tab widget. There
            is nothing to switch to, so nothing here is focusable or announced. */}
        <div className="ws-tabs xf-foot" aria-hidden>
          <span className="ws-tab">Metadata</span>
          <span className="ws-tab ws-tab-on">Line Items</span>
        </div>
      </figure>
    </div>
  );
}

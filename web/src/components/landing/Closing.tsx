import Link from "next/link";
import { ArrowRightIcon } from "@/components/ui/Icons";

/**
 * Closes the loop with the hero: the page opened with one lime word and ends
 * as one lime field. Identical in light and dark — it is the logo, and a logo
 * does not have a night mode.
 */
export function Closing() {
  return (
    <section className="closing band">
      <div className="closing-inner shell">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:items-end">
          <div>
            <p className="eyebrow eyebrow-bare text-on-lime opacity-70">Get started</p>
            <h2 className="t-h2 mt-5 max-w-[22ch]">Put your worst scan through it.</h2>
            <p className="mt-5 max-w-xl text-[1.0625rem] leading-relaxed opacity-80">
              Pick a PDF, name the workbook, and download the result. Nothing to configure beyond
              the address of your running backend.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 lg:justify-end">
            <Link href="/app/convert" className="btn btn-ink btn-lg">
              Convert a document
              <ArrowRightIcon size={17} />
            </Link>
            <Link
              href="/app/settings"
              className="btn btn-lg border-on-lime/30 text-on-lime hover:border-on-lime/60"
            >
              Check the connection
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

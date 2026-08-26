import Link from "next/link";
import { Transform } from "@/components/landing/Transform";
import { ArrowRightIcon, ChatIcon } from "@/components/ui/Icons";

const FACTS = ["PDF & scans", "IBM Docling", "gpt-oss-120b", "FAISS index"];

export function Hero() {
  return (
    <section className="ledger band band-flush pb-0">
      <div className="shell">
        <p className="eyebrow eyebrow-bare">Intelligent document processing</p>

        <h1 className="t-hero mt-5 max-w-[19ch]">
          Scanned invoices in.
          <br />
          Real{" "}
          {/* The logo is black type on a lime field. So is the promise. */}
          <span className="field-lime -mx-1 inline-block rounded-sm px-2.5 pb-0.5">
            spreadsheets
          </span>{" "}
          out.
        </h1>

        <div className="mt-8 grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:items-end lg:gap-16">
          <p className="t-lead max-w-2xl">
            YellowDoc.ai reads invoices, receipts, tax documents and bank statements, then rebuilds
            them as multi-sheet Excel workbooks. Every value survives character for character —
            including the OCR mistakes.
          </p>

          <div className="flex flex-wrap items-center gap-3 lg:justify-end">
            <Link href="/app/convert" className="btn btn-primary btn-lg">
              Convert a document
              <ArrowRightIcon size={17} />
            </Link>
            <Link href="/app/chat" className="btn btn-outline btn-lg">
              <ChatIcon size={17} />
              Ask about your documents
            </Link>
          </div>
        </div>

        <ul className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-rule pt-5">
          {FACTS.map((fact) => (
            <li key={fact} className="t-data flex items-center gap-2 text-fg-3">
              <span className="dot bg-lime" aria-hidden />
              {fact}
            </li>
          ))}
        </ul>

        <div className="mt-12 pb-4 lg:mt-16">
          <Transform />
        </div>
      </div>
    </section>
  );
}

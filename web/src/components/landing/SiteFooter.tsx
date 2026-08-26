import Link from "next/link";
import { LogoMark } from "@/components/brand/Logo";
import { GithubIcon } from "@/components/ui/Icons";

const COLUMNS: { heading: string; links: { label: string; href: string; external?: boolean }[] }[] =
  [
    {
      heading: "Product",
      links: [
        { label: "Convert a document", href: "/app/convert" },
        { label: "Ask a question", href: "/app/chat" },
        { label: "Conversions", href: "/app/history" },
        { label: "Backend settings", href: "/app/settings" },
      ],
    },
    {
      heading: "How it works",
      links: [
        { label: "What it preserves", href: "/#fidelity" },
        { label: "The four phases", href: "/#pipeline" },
        { label: "Asking questions", href: "/#ask" },
        { label: "Endpoints", href: "/#api" },
      ],
    },
  ];

export function SiteFooter() {
  return (
    <footer className="no-print border-t border-rule bg-bg-2">
      <div className="shell grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr] md:gap-16">
        <div>
          <div className="flex items-center gap-2.5">
            <LogoMark size={28} />
            <span className="font-display text-[1.3rem] leading-none font-bold tracking-[-0.03em]">
              YellowDoc<span className="text-clay-ink">.ai</span>
            </span>
          </div>
          <p className="t-small mt-4 max-w-sm text-fg-3">
            Intelligent document processing for financial records. Values are preserved character
            for character — nothing is corrected, rounded, or computed on your behalf.
          </p>
          <a
            href="https://github.com/Manabendu-ai/YellowDoc.ai"
            target="_blank"
            rel="noreferrer noopener"
            className="btn btn-outline btn-sm mt-5"
          >
            <GithubIcon size={16} />
            Source
          </a>
        </div>

        {COLUMNS.map((column) => (
          <div key={column.heading}>
            <p className="eyebrow eyebrow-bare">{column.heading}</p>
            <ul className="mt-4 flex flex-col gap-2.5">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="link text-[0.9375rem] text-fg-2">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-rule">
        <div className="shell flex flex-col items-start justify-between gap-3 py-5 sm:flex-row sm:items-center">
          <p className="t-data text-fg-3">YellowDoc.ai · v1.0.0</p>
          <p className="t-data text-fg-3">
            Web · Android (Kotlin, Compose) · REST
          </p>
        </div>
      </div>
    </footer>
  );
}

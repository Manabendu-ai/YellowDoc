import Link from "next/link";

/**
 * The mark: the stacked-document glyph from assests/ledgerMind.ai.png in
 * brand clay, with a lime badge for the thing the product actually promises —
 * the page came through unchanged.
 */
export function LogoMark({ size = 30, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden
      focusable={false}
      className={className}
    >
      {/* the sheet behind */}
      <rect
        x="11.4"
        y="2.9"
        width="16"
        height="20"
        rx="2.4"
        stroke="var(--yd-clay)"
        strokeWidth="1.6"
        opacity="0.45"
      />
      {/* the sheet in front */}
      <rect x="4.2" y="6.6" width="16" height="20" rx="2.4" fill="var(--yd-clay)" />
      {/* its ruled content */}
      <path
        d="M7.9 11.6h8.6M7.9 15h8.6M7.9 18.4h5.6"
        stroke="var(--yd-on-clay)"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.82"
      />
      {/* preserved exactly */}
      <circle cx="22.6" cy="22.6" r="6.1" fill="var(--yd-lime)" stroke="var(--yd-bg)" strokeWidth="2" />
      <path
        d="M19.9 22.7l2 2 3.4-3.9"
        stroke="var(--yd-on-lime)"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={`font-display text-[1.45rem] leading-none font-bold tracking-[-0.03em] ${className ?? ""}`}
    >
      YellowDoc<span className="text-clay-ink">.ai</span>
    </span>
  );
}

export function Logo({
  href = "/",
  size = 30,
  showTagline = false,
}: {
  href?: string;
  size?: number;
  showTagline?: boolean;
}) {
  return (
    <Link href={href} className="group flex items-center gap-2.5 no-underline" aria-label="YellowDoc.ai home">
      <LogoMark size={size} className="transition-transform duration-500 group-hover:-rotate-3" />
      <span className="flex flex-col">
        <Wordmark />
        {showTagline ? (
          <span className="font-mono text-[0.5625rem] tracking-[0.13em] uppercase text-fg-3 mt-1">
            Documents into intelligence
          </span>
        ) : null}
      </span>
    </Link>
  );
}

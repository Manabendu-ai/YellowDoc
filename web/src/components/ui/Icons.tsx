/**
 * Icon set — 24×24, 1.6 stroke, no fills, currentColor.
 *
 * Hand-drawn rather than pulled from a library: keeps the bundle free of a
 * dependency and lets the corner radii match the rest of the interface.
 */

type IconProps = {
  size?: number;
  className?: string;
};

function frame(size: number) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none" as const,
    stroke: "currentColor" as const,
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    focusable: false as const,
  };
}

export function SunIcon({ size = 18, className }: IconProps) {
  return (
    <svg {...frame(size)} className={className}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" />
    </svg>
  );
}

export function MoonIcon({ size = 18, className }: IconProps) {
  return (
    <svg {...frame(size)} className={className}>
      <path d="M20.5 14.2A8.5 8.5 0 1 1 9.8 3.5a6.8 6.8 0 0 0 10.7 10.7Z" />
    </svg>
  );
}

export function MonitorIcon({ size = 18, className }: IconProps) {
  return (
    <svg {...frame(size)} className={className}>
      <rect x="2.5" y="4" width="19" height="12.5" rx="2" />
      <path d="M8.5 20.5h7M12 16.5v4" />
    </svg>
  );
}

export function UploadIcon({ size = 18, className }: IconProps) {
  return (
    <svg {...frame(size)} className={className}>
      <path d="M12 15.5V4M8 8l4-4 4 4" />
      <path d="M3.5 14.5v3a3 3 0 0 0 3 3h11a3 3 0 0 0 3-3v-3" />
    </svg>
  );
}

export function DownloadIcon({ size = 18, className }: IconProps) {
  return (
    <svg {...frame(size)} className={className}>
      <path d="M12 4v11.5M8 11.5l4 4 4-4" />
      <path d="M3.5 15.5v2a3 3 0 0 0 3 3h11a3 3 0 0 0 3-3v-2" />
    </svg>
  );
}

export function SheetIcon({ size = 18, className }: IconProps) {
  return (
    <svg {...frame(size)} className={className}>
      <rect x="3" y="3.5" width="18" height="17" rx="2" />
      <path d="M3 9h18M3 15h18M9.5 9v11.5M15 3.5V9" />
    </svg>
  );
}

export function DocIcon({ size = 18, className }: IconProps) {
  return (
    <svg {...frame(size)} className={className}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
      <path d="M14 3v5h5M8.5 13h7M8.5 16.5h4.5" />
    </svg>
  );
}

export function ChatIcon({ size = 18, className }: IconProps) {
  return (
    <svg {...frame(size)} className={className}>
      <path d="M20.5 12.5a7.5 7.5 0 0 1-7.5 7.5H8.4L4 22.5l.9-3.7A7.5 7.5 0 0 1 13 5a7.5 7.5 0 0 1 7.5 7.5Z" />
      <path d="M9 11.5h8M9 15h5" />
    </svg>
  );
}

export function ClockIcon({ size = 18, className }: IconProps) {
  return (
    <svg {...frame(size)} className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

export function SlidersIcon({ size = 18, className }: IconProps) {
  return (
    <svg {...frame(size)} className={className}>
      <path d="M4 7h5M13 7h7M4 17h7M15 17h5" />
      <circle cx="11" cy="7" r="2" />
      <circle cx="13" cy="17" r="2" />
    </svg>
  );
}

export function CheckIcon({ size = 18, className }: IconProps) {
  return (
    <svg {...frame(size)} className={className}>
      <path d="M4.5 12.5l4.5 4.5L19.5 6.5" />
    </svg>
  );
}

export function CloseIcon({ size = 18, className }: IconProps) {
  return (
    <svg {...frame(size)} className={className}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function ArrowRightIcon({ size = 18, className }: IconProps) {
  return (
    <svg {...frame(size)} className={className}>
      <path d="M4 12h15M13 6l6 6-6 6" />
    </svg>
  );
}

export function AlertIcon({ size = 18, className }: IconProps) {
  return (
    <svg {...frame(size)} className={className}>
      <path d="M12 4.2 2.8 20h18.4L12 4.2Z" />
      <path d="M12 10v4.2" />
      <circle cx="12" cy="17.2" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function SendIcon({ size = 18, className }: IconProps) {
  return (
    <svg {...frame(size)} className={className}>
      <path d="M12 19.5V5M6 11l6-6 6 6" />
    </svg>
  );
}

export function MenuIcon({ size = 18, className }: IconProps) {
  return (
    <svg {...frame(size)} className={className}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function ScanIcon({ size = 18, className }: IconProps) {
  return (
    <svg {...frame(size)} className={className}>
      <path d="M4 8.5V6a2 2 0 0 1 2-2h2.5M20 8.5V6a2 2 0 0 0-2-2h-2.5M4 15.5V18a2 2 0 0 0 2 2h2.5M20 15.5V18a2 2 0 0 1-2 2h-2.5" />
      <path d="M3 12h18" />
    </svg>
  );
}

export function IndexIcon({ size = 18, className }: IconProps) {
  return (
    <svg {...frame(size)} className={className}>
      <circle cx="12" cy="12" r="2" />
      <circle cx="5" cy="6" r="1.6" />
      <circle cx="19" cy="6.5" r="1.6" />
      <circle cx="5.5" cy="18" r="1.6" />
      <circle cx="18.5" cy="17.5" r="1.6" />
      <path d="M10.4 10.8 6.3 7.2M13.7 11.3l3.9-3.5M10.5 13.4l-3.6 3.3M13.6 13.3l3.5 3" />
    </svg>
  );
}

export function BrainIcon({ size = 18, className }: IconProps) {
  return (
    <svg {...frame(size)} className={className}>
      <path d="M12 5.5v13" />
      <path d="M12 7a3 3 0 0 0-3-3 3 3 0 0 0-2.9 2.2A2.8 2.8 0 0 0 4 9a2.8 2.8 0 0 0 1 2.1A2.9 2.9 0 0 0 4.4 13c0 1.6 1.3 2.9 2.9 2.9.2.9 1 2.6 3 2.6h1.7" />
      <path d="M12 7a3 3 0 0 1 3-3 3 3 0 0 1 2.9 2.2A2.8 2.8 0 0 1 20 9a2.8 2.8 0 0 1-1 2.1c.4.5.6 1.2.6 1.9 0 1.6-1.3 2.9-2.9 2.9-.2.9-1 2.6-3 2.6" />
    </svg>
  );
}

/** Caret for native <select> controls, which we style ourselves. */
export function ChevronDownIcon({ size = 18, className }: IconProps) {
  return (
    <svg {...frame(size)} className={className}>
      <path d="m6 9.5 6 6 6-6" />
    </svg>
  );
}

/** Rebuild / re-run. Used by the search-index control in Settings. */
export function RefreshIcon({ size = 18, className }: IconProps) {
  return (
    <svg {...frame(size)} className={className}>
      <path d="M20 12a8 8 0 1 1-2.5-5.8" />
      <path d="M20 4v3.4h-3.4" />
    </svg>
  );
}

export function GithubIcon({ size = 18, className }: IconProps) {
  return (
    <svg {...frame(size)} className={className}>
      <path d="M9.2 20.4v-2.7c-2.7.5-3.4-1.2-3.6-2-.2-.5-.8-1.6-1.4-1.9-.5-.3.3-.3.4-.3.7 0 1.3.8 1.5 1.1.8 1.4 2.1 1.1 2.7.9.1-.6.4-1.2.7-1.5-2.5-.4-4-1.9-4-4.3 0-1.1.4-2.1 1-2.8-.2-.5-.3-1.6.1-2.5 0 0 1 .3 2.4 1.2a8.6 8.6 0 0 1 4.4 0c1.4-.9 2.4-1.2 2.4-1.2.4.9.3 2 .1 2.5.6.7 1 1.7 1 2.8 0 2.4-1.5 3.9-4 4.3.5.5.8 1.3.8 2.1v3.3" />
      <path d="M9.2 20.4c-3.6-1.2-6.2-4.5-6.2-8.4A8.9 8.9 0 0 1 12 3a8.9 8.9 0 0 1 9 9c0 3.9-2.6 7.2-6.2 8.4" />
    </svg>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { ArrowRightIcon, CloseIcon, MenuIcon } from "@/components/ui/Icons";

const LINKS = [
  { href: "#fidelity", label: "What it preserves" },
  { href: "#pipeline", label: "How it works" },
  { href: "#ask", label: "Asking questions" },
  { href: "#api", label: "API" },
];

export function SiteNav() {
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // A stray open menu after a resize past the breakpoint looks broken.
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("resize", close);
    return () => window.removeEventListener("resize", close);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      // Focus may be inside the panel that is about to unmount; put it back on
      // the control that opened it rather than dropping it on <body>.
      toggleRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="topbar no-print">
      <div className="shell flex h-16 items-center justify-between gap-4">
        <Logo />

        <nav aria-label="Sections" className="hidden items-center gap-7 lg:flex">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} className="link text-[0.9375rem] text-fg-2">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2.5">
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
          <Link href="/app/convert" className="btn btn-primary btn-sm hidden sm:inline-flex">
            Open the app
            <ArrowRightIcon size={15} />
          </Link>
          <button
            ref={toggleRef}
            type="button"
            className="btn btn-outline btn-sm lg:hidden"
            aria-expanded={open}
            aria-controls="site-menu"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <CloseIcon size={17} /> : <MenuIcon size={17} />}
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          </button>
        </div>
      </div>

      {/* Always rendered, hidden when closed — aria-controls has to point at an
          element that exists, and `hidden` keeps it out of the tab order. */}
      <div id="site-menu" hidden={!open} className="border-t border-rule bg-bg-2 lg:hidden">
        <div className="shell flex flex-col gap-1 py-4">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-md px-2 py-2.5 text-[0.9375rem] text-fg-2 hover:bg-bg-3 hover:text-fg"
            >
              {link.label}
            </a>
          ))}
          {/* Only below sm: above it, the same two controls are already in the
              bar and would appear twice at tablet widths. */}
          <div className="mt-3 flex items-center justify-between gap-3 border-t border-rule pt-4 sm:hidden">
            <ThemeToggle />
            <Link href="/app/convert" className="btn btn-primary btn-sm">
              Open the app
              <ArrowRightIcon size={15} />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

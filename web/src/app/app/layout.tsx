"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { ChatIcon, ClockIcon, SlidersIcon, UploadIcon } from "@/components/ui/Icons";
import { HealthPill } from "@/components/app/HealthPill";

const SCREENS = [
  { href: "/app/convert", label: "Convert", Icon: UploadIcon },
  { href: "/app/chat", label: "Ask", Icon: ChatIcon },
  { href: "/app/history", label: "History", Icon: ClockIcon },
  { href: "/app/settings", label: "Settings", Icon: SlidersIcon },
];

/**
 * A workbook has sheet tabs along the bottom; this app has them down the side.
 * Same idea — four named surfaces over one file.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[16.5rem_1fr]">
      <a href="#work" className="skip-link">
        Skip to content
      </a>

      {/* Sidebar — desktop */}
      <aside className="hidden border-r border-rule bg-bg-2 lg:flex lg:h-dvh lg:flex-col lg:sticky lg:top-0">
        <div className="border-b border-rule px-5 py-4">
          <Logo />
        </div>

        <nav aria-label="Screens" className="flex flex-1 flex-col gap-1 p-3">
          {SCREENS.map((screen) => {
            const on = pathname === screen.href;
            return (
              <Link
                key={screen.href}
                href={screen.href}
                aria-current={on ? "page" : undefined}
                className={`nav-item ${on ? "nav-item-on" : ""}`}
              >
                <screen.Icon size={17} className="nav-icon" />
                {screen.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-rule p-3">
          <HealthPill />
          <div className="mt-3 flex items-center justify-between gap-2 px-1">
            <ThemeToggle />
            <Link href="/" className="t-data text-fg-3 hover:text-fg">
              About
            </Link>
          </div>
        </div>
      </aside>

      {/* Top bar — mobile */}
      <div className="flex min-w-0 flex-col">
        <header className="topbar lg:hidden">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <Logo size={26} />
            <ThemeToggle />
          </div>
          <nav aria-label="Screens" className="ws-tabs">
            {SCREENS.map((screen) => {
              const on = pathname === screen.href;
              return (
                <Link
                  key={screen.href}
                  href={screen.href}
                  aria-current={on ? "page" : undefined}
                  className="ws-tab no-underline"
                >
                  {screen.label}
                </Link>
              );
            })}
          </nav>
        </header>

        {/* tabIndex -1 so the skip link actually moves focus here, not just the
            sequential-focus start point. */}
        <main
          id="work"
          tabIndex={-1}
          className="min-w-0 flex-1 px-4 py-7 outline-none sm:px-6 lg:px-10 lg:py-10"
        >
          {children}
        </main>
      </div>
    </div>
  );
}

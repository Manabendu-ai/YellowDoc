"use client";

import { useTheme, type ThemeChoice } from "@/components/theme/ThemeProvider";
import { MonitorIcon, MoonIcon, SunIcon } from "@/components/ui/Icons";

const OPTIONS: { value: ThemeChoice; label: string; Icon: typeof SunIcon }[] = [
  { value: "light", label: "Light", Icon: SunIcon },
  { value: "system", label: "Match system", Icon: MonitorIcon },
  { value: "dark", label: "Dark", Icon: MoonIcon },
];

/**
 * Three explicit states rather than a toggle — "match system" is a real
 * preference and hiding it behind a two-way switch loses it.
 *
 * A group of pressed buttons rather than `role="radiogroup"`: a radio group
 * promises one tab stop with arrow-key navigation, which this does not
 * implement. Three ordinary tab stops with `aria-pressed` is what it actually
 * is.
 */
export function ThemeToggle() {
  const { choice, setChoice } = useTheme();

  return (
    <div
      role="group"
      aria-label="Colour theme"
      className="inline-flex items-center gap-0.5 rounded-md border border-rule-2 bg-bg-2 p-0.5"
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = choice === value;
        return (
          <button
            key={value}
            type="button"
            aria-pressed={active}
            aria-label={label}
            title={label}
            onClick={() => setChoice(value)}
            className={[
              "grid h-7 w-7 place-items-center rounded-[5px] transition-colors duration-200",
              active ? "bg-lime text-on-lime" : "text-fg-3 hover:bg-bg-3 hover:text-fg",
            ].join(" ")}
          >
            <Icon size={15} />
          </button>
        );
      })}
    </div>
  );
}

import { AlertIcon, CheckIcon } from "@/components/ui/Icons";

type Tone = "bad" | "ok" | "flat";

/**
 * How the interface reports something going wrong or finishing.
 *
 * `title` says what happened; `detail` says how to fix it. Nothing here
 * apologises and nothing is vague about what happened.
 */
export function Notice({
  tone = "bad",
  title,
  detail,
  action,
}: {
  tone?: Tone;
  title: string;
  detail?: string;
  action?: React.ReactNode;
}) {
  const accent =
    tone === "bad"
      ? "border-bad/40 text-bad"
      : tone === "ok"
        ? "border-ok/40 text-ok"
        : "border-rule-2 text-fg-3";

  return (
    <div
      role={tone === "bad" ? "alert" : "status"}
      className={`flex items-start gap-3 rounded-lg border bg-bg-2 p-3.5 ${accent}`}
    >
      <span className="mt-0.5 flex-none">
        {tone === "ok" ? <CheckIcon size={17} /> : <AlertIcon size={17} />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[0.9375rem] leading-snug font-semibold">{title}</p>
        {detail ? <p className="t-data mt-1.5 break-words text-fg-3">{detail}</p> : null}
        {action ? <div className="mt-3">{action}</div> : null}
      </div>
    </div>
  );
}

/** An empty screen is an invitation to act, so it always names the next step. */
export function EmptyState({
  icon,
  title,
  detail,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  detail: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="grid place-items-center gap-3 rounded-lg border border-dashed border-rule-2 bg-bg-3 px-6 py-12 text-center">
      <span className="text-fg-3">{icon}</span>
      <p className="t-h4">{title}</p>
      <p className="t-small max-w-sm text-fg-3">{detail}</p>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}

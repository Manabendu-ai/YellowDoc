/** Small pure helpers shared by the browser and the route handlers. */

const ILLEGAL = /[\\/:*?"<>|[\]]/g;

/* Control characters, spelled with escapes so the source stays plain ASCII. */
// eslint-disable-next-line no-control-regex
const CONTROL = /[\u0000-\u001f\u007f]/g;

/**
 * Turn whatever someone typed into a filename the backend can safely join
 * onto a path. Falls back to the uploaded document's own name.
 *
 * Dots are removed rather than collapsed: `excel_generator` saves
 * `f"{name}.xlsx"` but `download_excel` looks the file up with
 * `os.path.splitext(...)[0]`, so a name like `invoice.v2` is written as
 * `invoice.v2.xlsx` and then searched for as `invoice.xlsx`. Never letting a
 * dot through is what keeps convert and download agreeing.
 *
 * Must also be idempotent — the convert route sanitises the name on the way
 * in and the download route sanitises it again on the way out.
 */
export function safeWorkbookName(requested: string, sourceFileName: string): string {
  const pick = requested.trim() || stripExtension(sourceFileName);

  return pick
    .replace(ILLEGAL, " ")
    .replace(/\.+/g, " ")
    .replace(CONTROL, " ")
    .replace(/\s+/g, " ")
    .slice(0, 80)
    // Trim last, so truncation can never leave a trailing space behind.
    .replace(/^\s+|\s+$/g, "");
}

export function stripExtension(name: string): string {
  return name.replace(/\.[^.]+$/, "");
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 KB";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatClock(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

/** "just now" / "14m ago" / "3 Feb, 09:12" — no dependency needed. */
export function formatWhen(at: number): string {
  const diff = Date.now() - at;
  if (diff < 45_000) return "just now";
  if (diff < 3_600_000) return `${Math.round(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.round(diff / 3_600_000)}h ago`;
  return new Date(at).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** The model returns confidence as free text, so match loosely. */
export function confidenceTone(confidence: string): "ok" | "warn" | "bad" | "flat" {
  const value = confidence.trim().toLowerCase();
  if (!value) return "flat";
  if (/(high|strong|certain|very good)/.test(value)) return "ok";
  if (/(medium|moderate|partial|mixed)/.test(value)) return "warn";
  if (/(low|weak|none|unsure|unknown)/.test(value)) return "bad";
  return "flat";
}

export function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

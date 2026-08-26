/**
 * Which document a question is allowed to see.
 *
 * Three screens touch this: the Ask screen holds it as state, the picker sets
 * it, and Convert pre-selects the document it just produced so the first
 * question after a conversion is already scoped. One module so the storage key
 * and the "everything" sentinel are not spelled out three times.
 */

/** localStorage key. Shared with `useStoredState` on the Ask screen. */
export const SCOPE_KEY = "yellowdoc.scope";

/** `""` means search the whole index; anything else is a filename in md_files/. */
export const ALL_DOCUMENTS = "";

/**
 * Pre-select `source` for the next visit to Ask.
 *
 * Writes the same JSON shape `useStoredState` reads, and stays silent on
 * failure — a blocked localStorage should cost you a pre-selection, not a
 * conversion you already paid minutes for.
 */
export function rememberScope(source: string | null): void {
  if (!source) return;
  try {
    window.localStorage.setItem(SCOPE_KEY, JSON.stringify(source));
  } catch {
    /* Private mode or quota. The picker still defaults to all documents. */
  }
}

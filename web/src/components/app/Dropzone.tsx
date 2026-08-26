"use client";

import { useCallback, useId, useState } from "react";
import { CloseIcon, DocIcon, UploadIcon } from "@/components/ui/Icons";
import { formatBytes } from "@/lib/format";

export const ACCEPTED = ".pdf,.png,.jpg,.jpeg,.tiff,.tif,.bmp,.webp,.docx,.pptx,.xlsx,.html,.md";

/**
 * Drop target that is also a plain file input — the input stays in the DOM and
 * keeps the label association, so it works by keyboard without any extra
 * handling. The focus ring is drawn on the wrapper (see .dropzone-wrap) because
 * the input itself is visually hidden.
 */
export function Dropzone({
  file,
  onPick,
  onClear,
  disabled,
}: {
  file: File | null;
  onPick: (file: File) => void;
  onClear: () => void;
  disabled?: boolean;
}) {
  const inputId = useId();
  const [over, setOver] = useState(false);

  const take = useCallback(
    (list: FileList | null) => {
      const next = list?.[0];
      if (next) onPick(next);
    },
    [onPick],
  );

  return (
    /* Relative, because the remove button is positioned over the drop surface
       rather than nested inside it — see the note on the button below.
       .dropzone-wrap carries the focus ring: the input itself is sr-only, so a
       ring drawn on it would be a 1px sliver nobody can see. */
    <div className="dropzone-wrap relative">
      <label
        htmlFor={inputId}
        onDragEnter={(event) => {
          event.preventDefault();
          if (!disabled) setOver(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setOver(false);
          if (!disabled) take(event.dataTransfer.files);
        }}
        className={`dropzone ${over ? "dropzone-over" : ""} ${file ? "dropzone-loaded" : ""} ${
          disabled ? "pointer-events-none opacity-60" : ""
        }`}
      >
        {file ? (
          <div className="flex w-full items-center gap-3.5 pr-12 text-left">
            <span className="grid h-10 w-10 flex-none place-items-center rounded-md bg-bg-3 text-clay-ink">
              <DocIcon size={19} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[0.9375rem] font-semibold">{file.name}</p>
              <p className="t-data mt-0.5 text-fg-3">
                {formatBytes(file.size)}
                {file.type ? ` · ${file.type}` : ""}
              </p>
            </div>
          </div>
        ) : (
          <>
            <span className="text-fg-3">
              <UploadIcon size={26} />
            </span>
            <span className="text-[0.9375rem] font-semibold">
              Drop a document here, or click to choose
            </span>
            <span className="t-data text-fg-3">
              PDF · scans and photos · DOCX · XLSX · PPTX · HTML — up to 40 MB
            </span>
          </>
        )}
      </label>

      {/* A sibling of the label, not a child: a label may not contain another
          interactive control, and nesting one means a click on it also toggles
          the file picker. */}
      {file ? (
        <button
          type="button"
          disabled={disabled}
          onClick={onClear}
          className="btn btn-quiet btn-sm absolute top-1/2 right-4 -translate-y-1/2"
        >
          <CloseIcon size={15} />
          <span className="sr-only">Remove {file.name}</span>
        </button>
      ) : null}

      <input
        id={inputId}
        type="file"
        accept={ACCEPTED}
        disabled={disabled}
        onChange={(event) => {
          take(event.target.files);
          /* Clear immediately — `take` has already read the file. Without this,
             picking the same document twice in a row fires no change event and
             the dropzone looks stuck. */
          event.target.value = "";
        }}
        className="sr-only"
      />
    </div>
  );
}

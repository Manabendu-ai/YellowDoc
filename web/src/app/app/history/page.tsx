"use client";

import Link from "next/link";
import { ClockIcon, DownloadIcon, CloseIcon } from "@/components/ui/Icons";
import { EmptyState } from "@/components/ui/Notice";
import { useConversions } from "@/hooks/useConversions";
import { downloadUrlFor } from "@/lib/api";
import { formatBytes, formatWhen } from "@/lib/format";

export default function HistoryPage() {
  const { records, remove, clear, loaded } = useConversions();

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-7">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">History</p>
          <h1 className="t-h2 mt-3">Everything you have converted.</h1>
          <p className="t-body mt-3 max-w-xl">
            Kept in this browser, because the backend keeps no record of its own —{" "}
            <span className="font-mono text-[0.8125rem]">excel_files/</span> is only a directory.
            Downloads pull the file straight from the server, so they work as long as it is still
            there.
          </p>
        </div>
        {records.length > 0 ? (
          <button type="button" className="btn btn-quiet btn-sm" onClick={clear}>
            Clear the list
          </button>
        ) : null}
      </header>

      {loaded && records.length === 0 ? (
        <EmptyState
          icon={<ClockIcon size={26} />}
          title="No conversions yet"
          detail="Once you turn a document into a workbook it will be listed here, with a link to download it again."
          action={
            <Link href="/app/convert" className="btn btn-outline btn-sm">
              Convert a document
            </Link>
          }
        />
      ) : null}

      {records.length > 0 ? (
        <div className="ws ws-scroll">
          <table className="ws-table">
            <caption className="sr-only">Workbooks generated from this browser</caption>
            <thead>
              <tr>
                <th scope="col">Workbook</th>
                <th scope="col">Source document</th>
                <th scope="col">Size</th>
                <th scope="col">When</th>
                <th scope="col">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id}>
                  <td className="font-semibold text-fg">{record.name}.xlsx</td>
                  <td className="max-w-[18rem] truncate">{record.source}</td>
                  <td className="whitespace-nowrap">{formatBytes(record.sizeBytes)}</td>
                  <td className="whitespace-nowrap">{formatWhen(record.at)}</td>
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      <a
                        href={downloadUrlFor(record.name)}
                        download={`${record.name}.xlsx`}
                        className="btn btn-quiet btn-sm"
                      >
                        <DownloadIcon size={15} />
                        Download
                      </a>
                      <button
                        type="button"
                        onClick={() => remove(record.id)}
                        className="btn btn-quiet btn-sm"
                        title={`Forget ${record.name}.xlsx`}
                      >
                        <CloseIcon size={15} />
                        <span className="sr-only">Forget {record.name}.xlsx</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {records.length > 0 ? (
        <p className="t-data text-fg-3">
          Forgetting a row removes it from this list only. The workbook itself stays on the server
          until you delete it there.
        </p>
      ) : null}
    </div>
  );
}

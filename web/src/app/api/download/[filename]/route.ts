import { NextResponse } from "next/server";
import { API_URL, describeFetchFailure, readBackendError } from "@/lib/server-config";
import { safeWorkbookName } from "@/lib/format";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/**
 * GET /api/download/[filename]
 *
 * Streams a previously generated workbook out of the backend's excel_files/
 * directory. The name is re-sanitised here so a crafted path can't walk out.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params;
  /* Next has already decoded the route param — decoding again would throw
     URIError on any name containing a literal %. */
  const name = safeWorkbookName(filename, "");

  if (!name) {
    return NextResponse.json({ error: "That workbook name is not valid." }, { status: 400 });
  }

  try {
    const res = await fetch(`${API_URL}/excel/download/${encodeURIComponent(name)}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(60_000),
    });

    if (!res.ok || !res.body) {
      return NextResponse.json(
        {
          error:
            res.status === 404
              ? `No workbook named "${name}" is on the server any more.`
              : "The workbook could not be downloaded.",
          detail: res.ok ? undefined : await readBackendError(res),
        },
        { status: res.status === 404 ? 404 : 502 },
      );
    }

    /* Header values are latin-1, so send an ASCII fallback plus the RFC 5987
       parameter for names like "Rechnung Müller". */
    const ascii = `${name.replace(/[^ -~]/g, "_")}.xlsx`;

    return new NextResponse(res.body, {
      status: 200,
      headers: {
        "content-type": XLSX_MIME,
        "content-disposition": `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(
          `${name}.xlsx`,
        )}`,
        "cache-control": "no-store",
      },
    });
  } catch (err) {
    return NextResponse.json({ error: describeFetchFailure(err) }, { status: 502 });
  }
}

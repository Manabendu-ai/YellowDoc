import { NextResponse } from "next/server";
import {
  API_URL,
  CONVERT_TIMEOUT_MS,
  describeFetchFailure,
  readBackendError,
} from "@/lib/server-config";
import { safeWorkbookName } from "@/lib/format";
import type { ConvertResult } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 800;

const MAX_BYTES = 40 * 1024 * 1024;

/**
 * POST /api/convert  (multipart: file, excel_filename)
 *
 * Forwards to `POST /excel/generate?excel_filename=…`, which runs the whole
 * pipeline synchronously: Docling layout extraction, LLM structuring, then
 * OpenPyXL synthesis. It can take minutes on a long scan.
 */
export async function POST(request: Request) {
  let incoming: FormData;

  try {
    incoming = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected a multipart upload." }, { status: 400 });
  }

  const file = incoming.get("file");
  const requested = incoming.get("excel_filename");

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Attach a PDF to convert." }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      {
        error: "That file is larger than 40 MB.",
        detail: "Split the document and convert it in parts.",
      },
      { status: 413 },
    );
  }

  const name = safeWorkbookName(typeof requested === "string" ? requested : "", file.name);

  if (!name) {
    return NextResponse.json({ error: "Name the workbook first." }, { status: 400 });
  }

  const outgoing = new FormData();
  outgoing.append("file", file, file.name);

  const target = `${API_URL}/excel/generate?${new URLSearchParams({ excel_filename: name })}`;

  try {
    const res = await fetch(target, {
      method: "POST",
      body: outgoing,
      headers: { accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(CONVERT_TIMEOUT_MS),
    });

    if (!res.ok) {
      const detail = await readBackendError(res);

      /* 422 comes from ExcelService when the extractor found no readable text,
         which for this product almost always means an image-only scan. */
      const error =
        res.status === 422
          ? "No readable text was found in that document."
          : "The conversion pipeline did not finish.";

      return NextResponse.json({ error, detail }, { status: res.status });
    }

    const body = (await res.json()) as ConvertResult;

    return NextResponse.json({
      status: body.status ?? "Excel File Generated Successfully",
      file: body.file ?? name,
      saved_at: body.saved_at ?? "",
      download_url: `/api/download/${encodeURIComponent(name)}`,
    } satisfies ConvertResult);
  } catch (err) {
    return NextResponse.json({ error: describeFetchFailure(err) }, { status: 502 });
  }
}

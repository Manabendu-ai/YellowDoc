/**
 * Shapes returned by the FastAPI backend.
 *
 * These mirror the Python models exactly — keep them in sync:
 *   RagResponse   -> RAG/structured_response.py  (RAGResponse)
 *   ConvertResult -> backend/router/excel_router.py (excel_generator)
 */

/** `POST /query?query=…` — RAG/structured_response.py::RAGResponse */
export type RagResponse = {
  query: string;
  answer: string;
  summary: string;
  confidence: string;
  key_points: string[];
  examples: string[];
};

/** `POST /excel/generate?excel_filename=…` */
export type ConvertResult = {
  status: string;
  file: string;
  saved_at: string;
  download_url: string;
};

/** `GET /` */
export type HealthResponse = {
  API: {
    application: string;
    version: string;
  };
};

export type HealthState =
  | { state: "unknown" }
  | { state: "checking" }
  | { state: "up"; application: string; version: string; ms: number }
  | { state: "down"; reason: string };

export type ChatRole = "you" | "yellowdoc";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  /** What the person typed, or the model's `answer` field. */
  text: string;
  /** Present on yellowdoc turns that came back structured. */
  detail?: Omit<RagResponse, "answer">;
  at: number;
  failed?: boolean;
};

/** One completed conversion, kept in the browser so History survives reloads. */
export type ConversionRecord = {
  id: string;
  /** Name the person gave the workbook, without extension. */
  name: string;
  /** Name of the PDF they uploaded. */
  source: string;
  sizeBytes: number;
  savedAt: string;
  at: number;
};

/**
 * Every error body the route handlers produce. `status` lives on the HTTP
 * response rather than in the payload, so it is optional here.
 */
export type ApiError = {
  error: string;
  detail?: string;
  status?: number;
};

export function isApiError(value: unknown): value is ApiError {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { error?: unknown }).error === "string"
  );
}

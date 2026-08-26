/**
 * Shapes returned by the FastAPI backend.
 *
 * These mirror the Python models exactly — keep them in sync:
 *   RagResponse      -> RAG/structured_response.py  (RAGAnswer)
 *   RagSource        -> RAG/structured_response.py  (RetrievedChunk)
 *   IndexedDocument  -> RAG/vector_store.py         (FaissVectorStore.documents)
 *   ConvertResult    -> backend/router/excel_router.py (excel_generator)
 */

/**
 * One passage retrieval actually used, attached server-side rather than asked of
 * the model — the only way a citation can be trusted.
 */
export type RagSource = {
  /** Human-facing name, e.g. `sample3`. */
  document: string;
  /** Filename inside md_files/, e.g. `sample3.md`. This is the picker's value. */
  source: string;
  chunk: number;
  /** Cosine similarity: higher is closer. */
  score: number;
  excerpt: string;
};

/** `POST /query?query=…&source=…` — RAG/structured_response.py::RAGAnswer */
export type RagResponse = {
  query: string;
  answer: string;
  summary: string;
  confidence: string;
  key_points: string[];
  examples: string[];
  /** The file the question was restricted to, or null for the whole index. */
  scope: string | null;
  sources: RagSource[];
};

/** `GET /query/documents` — one entry per file the index can currently see. */
export type IndexedDocument = {
  source: string;
  document: string;
  chunks: number;
  /** Unix seconds, or null on indexes written before tracking existed. */
  indexed_at: number | null;
};

/** `POST /query/reindex` */
export type ReindexResult = {
  mode: string;
  chunks: number;
  documents: number;
};

/** `POST /excel/generate?excel_filename=…` */
export type ConvertResult = {
  status: string;
  file: string;
  saved_at: string;
  download_url: string;
  /**
   * The name this document answers to in /query — present so the Ask screen can
   * preselect what was just converted. Null if markdown was never written.
   */
  source: string | null;
  /** False when indexing failed; the next question rescans and picks it up. */
  indexed: boolean;
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

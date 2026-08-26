# YellowDoc.ai — web

The Next.js front end for the YellowDoc.ai document pipeline. Two halves in one
app: a marketing page at `/`, and the working application under `/app`.

The Streamlit UI in `frontend/` is untouched and still runs independently.

## Running it

The backend has to be up first, from the repository root:

```bash
uvicorn backend.main:app --reload --port 8000
```

Then, in this directory:

```bash
npm install
cp .env.example .env.local   # only if the backend is not on localhost:8000
npm run dev
```

Open http://localhost:3000.

Other scripts: `npm run build`, `npm start`, `npm run lint` (ESLint 9 flat
config, `next/core-web-vitals` + `next/typescript`), `npm run typecheck`
(`tsc --noEmit`). `next-env.d.ts` is checked in rather than gitignored so
`typecheck` works on a fresh clone without building first.

## Configuration

| Variable                       | Default                 | What it does                                    |
| ------------------------------ | ----------------------- | ----------------------------------------------- |
| `YELLOWDOC_API_URL`            | `http://localhost:8000` | Where the FastAPI service is listening          |
| `YELLOWDOC_CONVERT_TIMEOUT_MS` | `600000`                | How long to wait for one conversion, in ms      |

Both are read **server-side only**. There is no `NEXT_PUBLIC_` variable here on
purpose — see below.

## Why every call goes through `/api/*`

`backend/main.py` does not install `CORSMiddleware`, so a browser cannot call it
directly. Two of its endpoints also take their arguments as *query parameters*
rather than a JSON body, which is awkward to call from a typed client.

So this app proxies. Each route handler in `src/app/api/` translates one backend
endpoint into something the browser can use:

| This app                      | Backend                                     | What the handler does                                              |
| ----------------------------- | ------------------------------------------- | ------------------------------------------------------------------ |
| `GET /api/health`             | `GET /`                                     | Unwraps the `API` envelope, times the round trip                   |
| `POST /api/convert`           | `POST /excel/generate?excel_filename=…`     | Multipart in, 40 MB cap, filename sanitised, `download_url` rewritten |
| `POST /api/query`             | `POST /query?query=…&source=…`              | JSON body → query params; normalises the bare-string "no match" case |
| `GET /api/documents`          | `GET /query/documents`                      | Drops entries without a filename, since those cannot be a scope     |
| `POST /api/reindex`           | `POST /query/reindex`                       | Rebuilds the FAISS store from `md_files/`                            |
| `GET /api/download/{name}`    | `GET /excel/download/{name}`                | Streams the workbook with the right MIME type and filename          |

Two consequences worth knowing: the backend needs no changes at all, and its
address never reaches the client bundle.

### Two rough edges this app works around

`/api/query` still normalises a bare-string response into the structured shape.
The current `RAG/search.py` always returns the model, but an older backend
returned `"No Relavant Document Found!"` on an empty retrieval, and the chat
should only ever deal with one shape.

`ExcelService` raises `ValueError` when the extractor found no text, which
FastAPI reports as a 422. For this product that nearly always means an
image-only scan Docling could not read, so the handler says exactly that.

## Structure

```
src/
  app/
    page.tsx              marketing page
    app/                  the application
      convert/            upload → pipeline progress → download
      chat/               questions against the FAISS index, scoped per document
      history/            workbooks made from this browser
      settings/           backend address, health check, theme, index rebuild
    api/                  the six proxy route handlers
    globals.css           the entire design system
    not-found.tsx         404
  components/
    brand/ landing/ app/ ui/ theme/
  hooks/                  useReveal, useStoredState, useConversions
  lib/                    api client, types, formatting, scope, server config
```

Each screen under `app/app/` has a two-line `layout.tsx` whose only job is to
export `metadata` — the pages themselves are client components and so cannot.

## The design system

`src/app/globals.css` is the whole thing — there is no Tailwind config file, no
CSS-in-JS, and no animation library.

Colour is sampled from `assests/ledgerMind.ai.png`: lime `#DBFF00`, ink
`#090909`, clay `#F69328`. The roles are deliberately narrow, and keeping to
them is what stops it reading as "bright accent on a dark background":

- **lime is architecture** — large flat fields, worksheet header rows, the
  closing band. Always with ink type on top. Never a thin stroke, never body
  text, never a glow.
- **clay is action** — buttons, focus rings, links, active tabs, the markers on
  preserved OCR artifacts.
- **ink and bone are the page.** Light mode is the primary expression, because
  that is the logo's own logic: black type on paper.

Tokens are two layers. Raw `--yd-*` values are declared on `:root` and flipped
in `.dark`; `@theme inline` then exposes them to Tailwind as `--color-*`. The
`inline` keyword is load-bearing — without it Tailwind resolves each chained
`var()` once at `:root` and class-based dark mode silently stops working.

Contrast is checked, not assumed. `--yd-fg-3`, `--yd-warn` and the status
colours are each pinned to clear 4.5:1 against `--yd-bg-3`, the darkest surface
any of them lands on. Focus rings are their own token, `--yd-focus`, because
true clay only reaches 2.1:1 on bone — light mode focuses in the deeper
`clay-ink`, dark mode in clay, and both clear the 3:1 non-text threshold. On a
lime field, type and rings are always ink.

Type is three faces with three jobs: Darker Grotesque for display, Archivo for
UI and body, IBM Plex Mono for every value that came out of a document — a nod
to Docling, which is IBM's.

Motion is hand-written CSS keyframes with per-element `animationDelay` for
orchestration, plus one `IntersectionObserver` hook for scroll reveals. Every
animation is disabled under `prefers-reduced-motion`, and the final state is
always preserved rather than the element being left mid-transition. There is
also a print stylesheet that resets the dark palette, since browsers drop dark
backgrounds and would otherwise put near-white text on white paper.

## Notes on behaviour

The conversion runs as one synchronous request with no progress events, so the
four stages shown while it works are estimated from elapsed time. The interface
says so rather than inventing a percentage. The status itself is announced
through a single permanent live region on the Convert screen — a region that
appears at the same moment as its text is never read out.

The endpoint this app calls, `POST /excel/generate`, uses a bare Docling
`DocumentConverter` with no OCR options. The PaddleOCR and PyMuPDF code under
`backend/document_processing/` is not reachable from it, so nothing in the
interface claims otherwise.

History lives in `localStorage`, because the backend keeps no record of what it
has produced — `excel_files/` is just a directory. Downloads still pull from the
server, so a cleared list does not delete anything. The chat thread is stored
the same way and capped at the last 80 turns, since answers carry their quoted
excerpts and the quota is finite.

## Scoping a question to one document

Retrieval over a handful of near-identical invoices reliably answers from the
wrong one: the chunks are so similar that the document you meant may not make
the global top-k at all, and naming the file in the question does not help —
the model can only work with the passages it was handed.

So the Ask screen has a document picker, backed by `GET /api/documents`. Picking
a file sends it as `source`, and the backend filters retrieval to that file
before the model sees anything. Every answer also carries the passages that
produced it, each labelled with its filename and similarity score, so an answer
drawn from the wrong document is visible rather than plausible. Convert
pre-selects whatever it just produced, via `src/lib/scope.ts`.

The FAISS store keeps a manifest of exactly which files it indexed, at which
size and mtime, with which model and chunk settings. Each conversion indexes its
own Markdown immediately; if the manifest ever stops matching `md_files/`, the
next question resynchronises or rebuilds. Deleting `faiss_store/` by hand is no
longer necessary — Settings has a rebuild button for the cases that cannot
self-heal, such as a corrupt store or a chunk size changed by hand.

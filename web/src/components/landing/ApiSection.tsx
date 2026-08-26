import { Reveal } from "@/components/ui/Reveal";

const ENDPOINTS: { method: string; path: string; takes: string; does: string }[] = [
  {
    method: "POST",
    path: "/excel/generate",
    takes: "file · excel_filename",
    does: "Runs the whole pipeline and returns where the workbook was written",
  },
  {
    method: "GET",
    path: "/excel/download/{filename}",
    takes: "filename",
    does: "Streams a generated .xlsx back",
  },
  {
    method: "POST",
    path: "/query",
    takes: "query",
    does: "Retrieves context and answers from the indexed documents",
  },
  {
    method: "GET",
    path: "/",
    takes: "—",
    does: "Application name and version",
  },
];

const SURFACES: { name: string; built: string; body: string }[] = [
  {
    name: "This web app",
    built: "Next.js · TypeScript",
    body: "Runs the conversion, keeps a local record of every workbook you have made, and holds the question thread. Talks to the backend through its own server routes, so the API never needs to be exposed to the browser.",
  },
  {
    name: "Android",
    built: "Kotlin · Compose · Material 3",
    body: "The same two jobs on a phone: photograph or pick a document, get the workbook back, save it through the system download manager. Point it at your server address in settings.",
  },
  {
    name: "The REST API",
    built: "FastAPI · OpenAPI",
    body: "Four endpoints, documented at /docs and /redoc on the running server. Both write endpoints take their arguments as query parameters, with the document itself as a multipart upload.",
  },
];

export function ApiSection() {
  return (
    <section id="api" className="ledger band scroll-mt-20">
      <div className="shell">
        <div className="max-w-3xl">
          <p className="eyebrow">Surfaces</p>
          <h2 className="t-h2 mt-5">Three ways in, one pipeline.</h2>
          <p className="t-lead mt-5">
            The web app, the Android client, and anything you write yourself all hit the same
            FastAPI service. No surface has a private path through the engine.
          </p>
        </div>

        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          {SURFACES.map((surface, index) => (
            <Reveal key={surface.name} delay={index * 70}>
              <article className="card card-hover flex h-full flex-col p-6">
                <h3 className="t-h4">{surface.name}</h3>
                <p className="t-data mt-2 text-clay-ink">{surface.built}</p>
                <p className="t-small mt-4">{surface.body}</p>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delay={120}>
          <div className="mt-10">
            <p className="eyebrow eyebrow-bare mb-4">Endpoints</p>
            {/* The endpoint reference is itself a worksheet. */}
            <div className="ws ws-scroll">
              <table className="ws-table">
                <caption className="sr-only">YellowDoc.ai REST endpoints</caption>
                <thead>
                  <tr>
                    <th scope="col">Method</th>
                    <th scope="col">Path</th>
                    <th scope="col">Takes</th>
                    <th scope="col">Does</th>
                  </tr>
                </thead>
                <tbody>
                  {ENDPOINTS.map((endpoint) => (
                    <tr key={`${endpoint.method} ${endpoint.path}`}>
                      <td className="font-semibold text-fg">{endpoint.method}</td>
                      <td className="whitespace-nowrap text-fg">{endpoint.path}</td>
                      <td className="whitespace-nowrap">{endpoint.takes}</td>
                      <td>{endpoint.does}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

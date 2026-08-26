import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Not found",
};

export default function NotFound() {
  return (
    <main className="ledger grid min-h-dvh place-items-center px-6 py-20">
      <div className="max-w-lg text-center">
        <p className="eyebrow eyebrow-bare">404</p>
        <h1 className="t-h2 mt-4">Nothing filed under that address.</h1>
        <p className="t-body mt-4">
          The page does not exist. The two places worth going are the overview and the app itself.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn btn-primary">
            Back to the overview
          </Link>
          <Link href="/app/convert" className="btn btn-outline">
            Open the app
          </Link>
        </div>
      </div>
    </main>
  );
}

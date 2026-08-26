import { ApiSection } from "@/components/landing/ApiSection";
import { AskSection } from "@/components/landing/AskSection";
import { Closing } from "@/components/landing/Closing";
import { Fidelity } from "@/components/landing/Fidelity";
import { Hero } from "@/components/landing/Hero";
import { Pipeline } from "@/components/landing/Pipeline";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { SiteNav } from "@/components/landing/SiteNav";

/**
 * The page argues one thing in five moves: the engine's job is fidelity, not
 * cleverness. Hero states it, Transform shows it happening, Fidelity proves it
 * with the engine's own forbidden fixes, Pipeline explains the machinery, and
 * Ask shows what fidelity buys you afterwards.
 */
export default function LandingPage() {
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <SiteNav />
      <main id="main" tabIndex={-1} className="outline-none">
        <Hero />
        <Fidelity />
        <Pipeline />
        <AskSection />
        <ApiSection />
        <Closing />
      </main>
      <SiteFooter />
    </>
  );
}

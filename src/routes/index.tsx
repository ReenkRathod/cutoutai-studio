import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Hero } from "@/components/site/Hero";
import { Features } from "@/components/site/Features";
import { HowItWorks } from "@/components/site/HowItWorks";
import { Demo } from "@/components/site/Demo";
import { Pricing } from "@/components/site/Pricing";
import { Testimonials } from "@/components/site/Testimonials";
import { Footer } from "@/components/site/Footer";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "CutoutAI Studio — Clear Backgrounds, Effortlessly" },
      { name: "description", content: "CutoutAI removes image backgrounds in seconds with AI. High-quality cutouts, batch processing, and a developer API." },
      { name: "keywords", content: "AI background remover, background removal, cutout AI, transparent background, background erase, CutoutAI Studio,Reenk Rathod" },
      { name: "robots", content: "index, follow" },
      { name: "author", content: "CutoutAI Studio" },
      { httpEquiv: "refresh", content: "3600" },
      { property: "og:title", content: "CutoutAI Studio — Clear Backgrounds, Effortlessly" },
      { property: "og:description", content: "AI-powered background removal for creators, teams, and developers." },
    ],
  }),
});

function Index() {
  return (
    <main>
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <Demo />
      <Pricing />
      <Testimonials />
      <Footer />
    </main>
  );
}

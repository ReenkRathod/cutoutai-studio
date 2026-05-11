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
      { title: "CutoutAI — Clear Backgrounds, Effortlessly" },
      {
        name: "description",
        content:
          "CutoutAI removes image backgrounds in seconds with AI. High-quality cutouts, batch processing, and a developer API.",
      },
      { property: "og:title", content: "CutoutAI — Clear Backgrounds, Effortlessly" },
      {
        property: "og:description",
        content: "AI-powered background removal for creators, teams, and developers.",
      },
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

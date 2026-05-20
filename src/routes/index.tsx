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
      { title: "Cutout AI - Free Background Remover | CutoutAI Studio" },
      { name: "description", content: "Remove image backgrounds instantly in 1-click for free. Cutout AI (CutoutAI) uses advanced artificial intelligence for pixel-perfect transparency." },
      { name: "keywords", content: "cutout ai, cutoutai, cutout ai background remover, AI background remover, background removal, transparent background, background erase, free background remover online, Reenk Rathod" },
      { name: "robots", content: "index, follow" },
      { name: "author", content: "CutoutAI Studio" },
      { httpEquiv: "refresh", content: "3600" },
      { property: "og:title", content: "Cutout AI - Free Background Remover | CutoutAI Studio" },
      { property: "og:description", content: "Remove image backgrounds instantly in 1-click for free with Cutout AI." },
      { property: "og:image", content: "https://cutoutai.studio/favicon.svg" },
      {
        "script:ld+json": {
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "Cutout AI Studio",
          "alternateName": ["CutoutAI", "Cutout AI"],
          "operatingSystem": "All",
          "applicationCategory": "MultimediaApplication",
          "description": "Cutout AI is a next-generation AI tool to instantly remove image backgrounds with pixel-perfect precision.",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
          },
          "featureList": [
            "AI background removal",
            "Instant processing",
            "No sign-up required",
            "Batch processing",
            "Developer API access"
          ]
        }
      }
    ],
    links: [
      { rel: "canonical", href: "https://cutoutai.studio/" }
    ]
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

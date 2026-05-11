import { useState } from "react";
import { Loader2 } from "lucide-react";
import beforeImg from "@/assets/demo-before.jpg";
import afterImg from "@/assets/demo-after.png";

export function Demo() {
  const [view, setView] = useState<"before" | "after">("after");
  const [loading, setLoading] = useState(false);

  const toggle = (v: "before" | "after") => {
    if (v === view) return;
    setLoading(true);
    setTimeout(() => {
      setView(v);
      setLoading(false);
    }, 600);
  };

  return (
    <section id="demo" className="px-4 py-24">
      <div className="mx-auto max-w-5xl">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-sm font-semibold uppercase tracking-wider text-gradient">Live Demo</p>
          <h2 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">See the magic in action</h2>
        </div>

        <div className="mt-12 rounded-3xl glass p-4 sm:p-6 shadow-soft">
          <div className="mx-auto mb-4 inline-flex rounded-xl bg-muted p-1">
            <button
              onClick={() => toggle("before")}
              className={`rounded-lg px-5 py-2 text-sm font-semibold transition ${
                view === "before" ? "bg-gradient-brand text-white shadow-glow" : "text-muted-foreground"
              }`}
            >
              Original
            </button>
            <button
              onClick={() => toggle("after")}
              className={`rounded-lg px-5 py-2 text-sm font-semibold transition ${
                view === "after" ? "bg-gradient-brand text-white shadow-glow" : "text-muted-foreground"
              }`}
            >
              Background Removed
            </button>
          </div>

          <div className="relative mx-auto aspect-square max-w-xl overflow-hidden rounded-2xl">
            <div className={`absolute inset-0 ${view === "after" ? "checker-bg" : ""}`}>
              <img
                src={view === "after" ? afterImg : beforeImg}
                alt="Demo result"
                loading="lazy"
                width={1024}
                height={1024}
                className="h-full w-full object-cover transition-opacity duration-500"
              />
            </div>
            {loading && (
              <div className="absolute inset-0 grid place-items-center bg-background/60 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-10 w-10 animate-spin text-[var(--neon-purple)]" />
                  <p className="text-sm font-medium">AI processing…</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

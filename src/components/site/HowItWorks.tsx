import { Upload, Cpu, Download } from "lucide-react";

const steps = [
  { icon: Upload, title: "Upload Image", desc: "Drag & drop or pick a file from your device." },
  { icon: Cpu, title: "AI Processes It", desc: "Our model detects the subject and clips the background." },
  { icon: Download, title: "Download Result", desc: "Get a transparent PNG ready to use anywhere." },
];

export function HowItWorks() {
  return (
    <section className="px-4 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-sm font-semibold uppercase tracking-wider text-gradient">How it works</p>
          <h2 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Three steps. Zero hassle.</h2>
        </div>

        <div className="relative mt-16 grid gap-10 md:grid-cols-3">
          {/* Connecting line */}
          <div className="absolute top-10 left-[16%] right-[16%] hidden h-px md:block">
            <div className="h-full w-full bg-gradient-to-r from-transparent via-[var(--neon-purple)] to-transparent opacity-40" />
          </div>

          {steps.map((s, i) => (
            <div key={s.title} className="relative text-center animate-fade-in" style={{ animationDelay: `${i * 0.15}s` }}>
              <div className="relative mx-auto grid h-20 w-20 place-items-center rounded-2xl bg-gradient-brand shadow-glow">
                <s.icon className="h-9 w-9 text-white" />
                <span className="absolute -top-2 -right-2 grid h-7 w-7 place-items-center rounded-full glass text-xs font-bold text-foreground shadow-soft">
                  {i + 1}
                </span>
              </div>
              <h3 className="mt-5 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-xs mx-auto">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

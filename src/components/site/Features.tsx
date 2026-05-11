import { Zap, Image as ImageIcon, Layers, Code2 } from "lucide-react";

const features = [
  { icon: Zap, title: "Instant Background Removal", desc: "Remove backgrounds in under 2 seconds with our optimized AI model." },
  { icon: ImageIcon, title: "High-Quality Output", desc: "4K resolution with crisp edges, even on hair and fine details." },
  { icon: Layers, title: "Batch Processing", desc: "Upload hundreds of images at once and process them in parallel." },
  { icon: Code2, title: "API Integration", desc: "Drop our REST API into your workflow with a few lines of code." },
];

export function Features() {
  return (
    <section id="features" className="px-4 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-sm font-semibold uppercase tracking-wider text-gradient">Features</p>
          <h2 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            Everything you need, <span className="text-gradient">nothing you don't</span>
          </h2>
          <p className="mt-4 text-muted-foreground">Built for creators, designers, and developers who value speed and quality.</p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="group relative rounded-2xl glass p-6 shadow-soft transition hover:-translate-y-2 hover:shadow-glow animate-fade-in"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-brand opacity-0 blur-xl transition group-hover:opacity-20" />
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-brand shadow-glow">
                <f.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="mt-5 font-semibold text-lg">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

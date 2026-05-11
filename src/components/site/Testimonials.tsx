import { Star } from "lucide-react";

const items = [
  {
    name: "Sarah Chen",
    role: "Product Designer @ Linear",
    quote: "CutoutAI cut my design workflow in half. The edge quality on hair is unreal.",
    avatar: "SC",
    color: "from-pink-400 to-purple-500",
  },
  {
    name: "Marcus Rivera",
    role: "Founder @ ShopFlow",
    quote: "We process 10k product photos a week. The API just works. Zero downtime in 6 months.",
    avatar: "MR",
    color: "from-cyan-400 to-blue-500",
  },
  {
    name: "Aiko Tanaka",
    role: "Photographer",
    quote: "The fastest, cleanest tool I've tried. It handles complex backgrounds like nothing else.",
    avatar: "AT",
    color: "from-amber-400 to-pink-500",
  },
];

export function Testimonials() {
  return (
    <section className="px-4 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-sm font-semibold uppercase tracking-wider text-gradient">Testimonials</p>
          <h2 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Loved by creators worldwide</h2>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {items.map((t, i) => (
            <div
              key={t.name}
              className="group rounded-2xl glass p-7 shadow-soft transition hover:-translate-y-2 hover:shadow-glow animate-fade-in"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, k) => (
                  <Star key={k} className="h-4 w-4 fill-[var(--neon-purple)] text-[var(--neon-purple)]" />
                ))}
              </div>
              <p className="mt-4 text-foreground/90">"{t.quote}"</p>
              <div className="mt-6 flex items-center gap-3">
                <div className={`grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br ${t.color} text-sm font-bold text-white shadow-soft`}>
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

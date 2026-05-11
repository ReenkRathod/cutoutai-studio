import { Twitter, Github, Linkedin, Instagram } from "lucide-react";
import { Logo } from "./Logo";

const cols = [
  { title: "Product", links: ["Features", "Pricing", "API", "Changelog"] },
  { title: "Company", links: ["About", "Blog", "Careers", "Contact"] },
  { title: "Resources", links: ["Docs", "Help Center", "Privacy", "Terms"] },
];

export function Footer() {
  return (
    <footer
      id="contact"
      className="relative mt-20 overflow-hidden rounded-t-[2.5rem] px-4 py-16 text-white"
      style={{ background: "var(--gradient-footer)" }}
    >
      <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[60%] -translate-x-1/2 rounded-full bg-gradient-brand opacity-30 blur-3xl" />
      <div className="mx-auto max-w-6xl relative">
        <div className="grid gap-10 md:grid-cols-5">
          <div className="md:col-span-2">
            <Logo />
            <p className="mt-4 max-w-xs text-sm text-white/70">
              Clear backgrounds, effortlessly. AI-powered cutouts for creators, teams, and developers.
            </p>
            <div className="mt-6 flex gap-3">
              {[Twitter, Github, Linkedin, Instagram].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="grid h-10 w-10 place-items-center rounded-xl glass-dark transition hover:scale-110 hover:bg-white/10"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <h4 className="text-sm font-semibold">{c.title}</h4>
              <ul className="mt-4 space-y-2.5">
                {c.links.map((l) => (
                  <li key={l}>
                    <a href="#" className="text-sm text-white/70 transition hover:text-white">{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/60">© {new Date().getFullYear()} CutoutAI. All rights reserved.</p>
          <p className="text-xs text-white/60">Clear Backgrounds, Effortlessly.</p>
        </div>
      </div>
    </footer>
  );
}

import { useState } from "react";
import { Menu, X, Sparkles, LogOut, User as UserIcon } from "lucide-react";
import { Logo } from "./Logo";
import { Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";


const links = [
  { label: "Home", href: "#home" },
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "API", href: "#api" },
  { label: "Contact", href: "#contact" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();
  
  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 pt-4">
      <nav className="glass mx-auto flex max-w-6xl items-center justify-between rounded-2xl px-5 py-3 shadow-soft">
        <Logo />
        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
        </div>
        <div className="hidden md:flex items-center gap-4">
          {!user ? (
            <>
              <Link
                to="/login"
                className="text-sm font-semibold text-muted-foreground transition hover:text-foreground"
              >
                Log in
              </Link>
              <Link
                to="/signup"
                className="group relative inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:scale-105"
              >
                Sign up
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <Link
                to="/dashboard"
                className="text-sm font-semibold text-muted-foreground transition hover:text-foreground"
              >
                Dashboard
              </Link>
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                  <UserIcon className="h-4 w-4 text-muted-foreground" />
                </div>
                <span className="hidden lg:inline-block">
                  {user.user_metadata?.full_name || user.email}
                </span>
              </div>
              <button
                onClick={signOut}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden rounded-lg p-2 hover:bg-muted"
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>
      {open && (
        <div className="glass mx-auto mt-2 max-w-6xl rounded-2xl p-4 md:hidden animate-fade-in">
          <div className="flex flex-col gap-3">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="text-sm font-medium text-foreground/80"
              >
                {l.label}
              </a>
            ))}
            
            <div className="my-2 h-px w-full bg-border" />
            
            {!user ? (
              <div className="flex flex-col gap-3">
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-border px-5 py-2.5 text-center text-sm font-semibold text-foreground transition hover:bg-muted"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setOpen(false)}
                  className="rounded-xl bg-gradient-brand px-5 py-2.5 text-center text-sm font-semibold text-white shadow-glow"
                >
                  Sign up
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <Link
                  to="/dashboard"
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-border px-5 py-2.5 text-center text-sm font-semibold text-foreground transition hover:bg-muted"
                >
                  Dashboard
                </Link>
                <div className="flex items-center gap-2 px-2 text-sm font-medium text-foreground">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <UserIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span className="truncate">
                    {user.user_metadata?.full_name || user.email}
                  </span>
                </div>
                <button
                  onClick={() => {
                    signOut();
                    setOpen(false);
                  }}
                  className="flex items-center justify-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

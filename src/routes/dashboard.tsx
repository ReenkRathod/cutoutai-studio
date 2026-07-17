import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Activity, Clock, Download, Image as ImageIcon, Sparkles, Loader2 } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState<{ plan: string; credits_remaining: number } | null>(null);
  const [stats, setStats] = useState({
    totalImages: 0,
    avgTimeMs: 0,
    totalDownloads: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate({ to: "/login" });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    async function loadDashboardData() {
      if (!user) return;
      
      try {
        // Fetch Profile
        const { data: profileData } = await supabase
          .from("profiles")
          .select("plan, credits_remaining")
          .eq("id", user.id)
          .single();
        
        if (profileData) {
          setProfile(profileData);
        }

        // Fetch Stats
        const { data: images } = await supabase
          .from("user_images")
          .select("processing_time_ms, downloads_count")
          .eq("user_id", user.id);
          
        if (images && images.length > 0) {
          const totalImages = images.length;
          const totalDownloads = images.reduce((sum, img) => sum + (img.downloads_count || 0), 0);
          
          const validTimes = images.filter(i => i.processing_time_ms > 0);
          const avgTimeMs = validTimes.length > 0 
            ? validTimes.reduce((sum, img) => sum + img.processing_time_ms, 0) / validTimes.length 
            : 0;
            
          setStats({
            totalImages,
            avgTimeMs,
            totalDownloads,
          });
        }
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      loadDashboardData();
    }
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--neon-purple)]" />
      </div>
    );
  }

  const isPro = profile?.plan === "pro";

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <div className="mx-auto max-w-6xl px-4 pb-24 pt-32">
        <div className="mb-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Your Dashboard</h1>
            <p className="mt-2 text-muted-foreground">
              Welcome back, {user?.user_metadata?.full_name || user?.email}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Link
              to="/"
              hash="demo"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:scale-105"
            >
              <ImageIcon className="h-4 w-4" />
              Remove Background
            </Link>
          </div>
        </div>

        {/* Plan & Credits */}
        <div className="mb-8 grid gap-6 md:grid-cols-2">
          <div className="relative overflow-hidden rounded-3xl border border-border glass p-8 shadow-soft">
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[var(--neon-purple)] opacity-10 blur-2xl" />
            
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <Sparkles className="h-4 w-4 text-[var(--neon-purple)]" />
              Current Plan
            </div>
            
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-4xl font-bold capitalize">{profile?.plan || "Free"}</span>
            </div>
            
            {!isPro && (
              <a
                href="/#pricing"
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
              >
                Upgrade to Pro
              </a>
            )}
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-border glass p-8 shadow-soft">
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[var(--neon-cyan)] opacity-10 blur-2xl" />
            
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <Activity className="h-4 w-4 text-[var(--neon-cyan)]" />
              Credits Remaining
            </div>
            
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-4xl font-bold">{profile?.credits_remaining || 0}</span>
              <span className="text-muted-foreground">credits</span>
            </div>
            
            <p className="mt-6 text-sm text-muted-foreground">
              1 credit = 1 high-resolution background removal.
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <h2 className="mb-4 mt-12 text-xl font-bold">Usage Statistics</h2>
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="rounded-2xl border border-border glass p-6 shadow-sm">
            <div className="flex items-center gap-3 text-muted-foreground">
              <ImageIcon className="h-5 w-5" />
              <span className="text-sm font-medium">Images Processed</span>
            </div>
            <p className="mt-3 text-3xl font-bold">{stats.totalImages}</p>
          </div>
          
          <div className="rounded-2xl border border-border glass p-6 shadow-sm">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Download className="h-5 w-5" />
              <span className="text-sm font-medium">Total Downloads</span>
            </div>
            <p className="mt-3 text-3xl font-bold">{stats.totalDownloads}</p>
          </div>
          
          <div className="rounded-2xl border border-border glass p-6 shadow-sm">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Clock className="h-5 w-5" />
              <span className="text-sm font-medium">Avg. Processing Time</span>
            </div>
            <p className="mt-3 text-3xl font-bold">
              {stats.avgTimeMs > 0 ? (stats.avgTimeMs / 1000).toFixed(2) : "0"}s
            </p>
          </div>
        </div>
      </div>
      
      <Footer />
    </main>
  );
}

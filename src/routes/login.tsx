import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Mail, Lock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Logo } from "@/components/site/Logo";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

export const Route = createFileRoute("/login")({
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setError(null);
    setLoading(true);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError) throw authError;

      navigate({ to: "/" });
    } catch (err: any) {
      setError(err.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    const email = getValues("email");
    if (!email || errors.email) {
      setError("Please enter a valid email address to reset your password.");
      return;
    }
    
    setError(null);
    setLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (resetError) throw resetError;
      setResetSent(true);
    } catch (err: any) {
      setError(err.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="absolute left-4 top-4 md:left-8 md:top-8">
        <Logo />
      </div>

      <div className="w-full max-w-md animate-fade-in space-y-8 rounded-3xl border border-border glass p-8 shadow-soft">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight">Welcome back</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to your account to continue
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <input
                {...register("email")}
                type="email"
                placeholder="Email address"
                className="w-full rounded-xl border border-input bg-background py-2 pl-10 pr-4 text-sm outline-none transition focus:border-[var(--neon-purple)] focus:ring-1 focus:ring-[var(--neon-purple)]"
              />
            </div>
            {errors.email && (
              <p className="text-xs text-red-400">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <input
                {...register("password")}
                type="password"
                placeholder="Password"
                className="w-full rounded-xl border border-input bg-background py-2 pl-10 pr-4 text-sm outline-none transition focus:border-[var(--neon-purple)] focus:ring-1 focus:ring-[var(--neon-purple)]"
              />
            </div>
            {errors.password && (
              <p className="text-xs text-red-400">{errors.password.message}</p>
            )}
          </div>

          {error && <div className="text-sm text-red-400">{error}</div>}
          {resetSent && (
            <div className="text-sm text-green-400">
              Password reset email sent! Check your inbox.
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleResetPassword}
              className="text-xs text-muted-foreground hover:text-foreground hover:underline"
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-xl bg-gradient-brand py-2.5 text-sm font-semibold text-white shadow-glow transition hover:scale-[1.02] disabled:pointer-events-none disabled:opacity-70"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign in"}
          </button>
        </form>

        <div className="text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="font-semibold text-foreground hover:underline"
          >
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}

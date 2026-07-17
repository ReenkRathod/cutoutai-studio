import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Mail, Lock, User } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Logo } from "@/components/site/Logo";

const signupSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type SignupForm = z.infer<typeof signupSchema>;

export const Route = createFileRoute("/signup")({
  component: Signup,
});

function Signup() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupForm) => {
    setError(null);
    setLoading(true);

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
          },
        },
      });

      if (signUpError) throw signUpError;

      // If email confirmations are enabled in Supabase, the user won't have a session immediately.
      // We check if we got a session. If not, they need to check their email.
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (sessionData.session) {
        navigate({ to: "/" });
      } else {
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err.message || "Failed to sign up");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
        <div className="max-w-md space-y-4 rounded-3xl border border-border glass p-8 shadow-soft">
          <Mail className="mx-auto h-12 w-12 text-[var(--neon-cyan)]" />
          <h2 className="text-2xl font-bold">Check your email</h2>
          <p className="text-muted-foreground">
            We've sent a confirmation link to your email address. Please click the link to activate your account.
          </p>
          <Link
            to="/login"
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-gradient-brand px-6 py-2.5 text-sm font-semibold text-white shadow-glow"
          >
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="absolute left-4 top-4 md:left-8 md:top-8">
        <Logo />
      </div>

      <div className="w-full max-w-md animate-fade-in space-y-8 rounded-3xl border border-border glass p-8 shadow-soft">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight">Create an account</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Join Cutout AI to start removing backgrounds
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <div className="relative">
              <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <input
                {...register("fullName")}
                type="text"
                placeholder="Full Name"
                className="w-full rounded-xl border border-input bg-background py-2 pl-10 pr-4 text-sm outline-none transition focus:border-[var(--neon-purple)] focus:ring-1 focus:ring-[var(--neon-purple)]"
              />
            </div>
            {errors.fullName && (
              <p className="text-xs text-red-400">{errors.fullName.message}</p>
            )}
          </div>

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

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-xl bg-gradient-brand py-2.5 text-sm font-semibold text-white shadow-glow transition hover:scale-[1.02] disabled:pointer-events-none disabled:opacity-70"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign up"}
          </button>
        </form>

        <div className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-foreground hover:underline"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Lock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Logo } from "@/components/site/Logo";

const resetSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type ResetForm = z.infer<typeof resetSchema>;

export const Route = createFileRoute("/reset-password")({
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
  });

  useEffect(() => {
    // Check if we have the recovery token in the URL hash, supabase handles it automatically
    // but we can listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        // Ready to reset password
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const onSubmit = async (data: ResetForm) => {
    setError(null);
    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (updateError) throw updateError;

      // Navigate to home after successful password update
      navigate({ to: "/" });
    } catch (err: any) {
      setError(err.message || "Failed to update password");
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
          <h2 className="text-3xl font-bold tracking-tight">Set new password</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your new password below
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <input
                {...register("password")}
                type="password"
                placeholder="New password"
                className="w-full rounded-xl border border-input bg-background py-2 pl-10 pr-4 text-sm outline-none transition focus:border-[var(--neon-purple)] focus:ring-1 focus:ring-[var(--neon-purple)]"
              />
            </div>
            {errors.password && (
              <p className="text-xs text-red-400">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <input
                {...register("confirmPassword")}
                type="password"
                placeholder="Confirm new password"
                className="w-full rounded-xl border border-input bg-background py-2 pl-10 pr-4 text-sm outline-none transition focus:border-[var(--neon-purple)] focus:ring-1 focus:ring-[var(--neon-purple)]"
              />
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-red-400">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {error && <div className="text-sm text-red-400">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-xl bg-gradient-brand py-2.5 text-sm font-semibold text-white shadow-glow transition hover:scale-[1.02] disabled:pointer-events-none disabled:opacity-70"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Update password"}
          </button>
        </form>
      </div>
    </div>
  );
}

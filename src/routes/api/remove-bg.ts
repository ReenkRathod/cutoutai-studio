import { createFileRoute } from "@tanstack/react-router";
import { removeBackgroundApi } from "@/lib/bg-removal";
import { createClient } from "@supabase/supabase-js";

export const Route = createFileRoute("/api/remove-bg")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const authHeader = request.headers.get("Authorization");
          if (!authHeader) {
            return new Response("Unauthorized - Missing Token", { status: 401 });
          }
          const token = authHeader.replace("Bearer ", "");
          
          const supabaseUrl = process.env.SUPABASE_URL;
          const supabaseKey = process.env.SUPABASE_ANON_KEY;

          if (!supabaseUrl || !supabaseKey) {
            return new Response("Server configuration error: Supabase credentials not set", { status: 500 });
          }

          // Base client for token verification
          const supabase = createClient(supabaseUrl, supabaseKey);
          
          const { data: { user }, error: authError } = await supabase.auth.getUser(token);
          if (authError || !user) {
            return new Response("Unauthorized - Invalid Token", { status: 401 });
          }

          // Authenticated client — passes the user's JWT so RLS allows the query
          const authedSupabase = createClient(supabaseUrl, supabaseKey, {
            global: { headers: { Authorization: `Bearer ${token}` } },
          });

          const { data: profile, error: profileError } = await authedSupabase
            .from("profiles")
            .select("credits_remaining")
            .eq("id", user.id)
            .single();

          if (profileError) {
            console.error("[remove-bg] profile fetch error:", profileError);
          }

          if (!profile || profile.credits_remaining <= 0) {
            return new Response("Insufficient credits. Please upgrade to Pro or buy more credits.", { status: 402 });
          }

          const formData = await request.formData();
          const file = formData.get("image") as File;

          if (!file) {
            return new Response("No image file provided", { status: 400 });
          }

          const resultBlob = await removeBackgroundApi(file);
          
          // Deduct credit using authed client (passes RLS)
          await authedSupabase.from("profiles").update({ credits_remaining: profile.credits_remaining - 1 }).eq("id", user.id);

          return new Response(resultBlob, {
            headers: {
              "Content-Type": "image/png",
              "Content-Disposition": 'attachment; filename="result.png"',
            },
          });
        } catch (err: any) {
          console.error("[api-remove-bg]", err);
          return new Response(err.message || "Internal Server Error", {
            status: 500,
            headers: { "Content-Type": "text/plain" }
          });
        }
      },
    },
  },
});

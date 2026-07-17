import { createFileRoute } from "@tanstack/react-router";
import { hmacSha256Hex, timingSafeEqual } from "@/lib/razorpay-crypto";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

// Razorpay webhooks are verified against the raw request body.
const WebhookEventSchema = z.record(z.any());

export const Route = createFileRoute("/api/razorpay/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
        if (!webhookSecret) {
          return Response.json(
            { error: "Missing RAZORPAY_WEBHOOK_SECRET" },
            { status: 500 },
          );
        }

        const signatureHeader = request.headers.get("x-razorpay-signature");
        if (!signatureHeader) {
          return Response.json({ error: "Missing X-Razorpay-Signature header" }, { status: 400 });
        }

        const rawBody = await request.text();
        const expected = (await hmacSha256Hex(webhookSecret, rawBody)).toLowerCase();
        const actual = signatureHeader.toLowerCase();

        if (!timingSafeEqual(expected, actual)) {
          return Response.json({ error: "Invalid webhook signature" }, { status: 400 });
        }

        // Signature verified; parse JSON so you can branch on event type.
        let event: unknown = null;
        try {
          event = rawBody ? JSON.parse(rawBody) : null;
        } catch {
          event = rawBody;
        }

        if (event != null) {
          const parsed = WebhookEventSchema.safeParse(event);
          if (!parsed.success) {
            // Still return 200 after signature validation to avoid Razorpay retries for malformed JSON.
            return Response.json({ ok: true, parsed: false });
          }

          const payload = event as any;
          if (payload.event === "order.paid" || payload.event === "payment.captured") {
            const userId = payload.payload?.payment?.entity?.notes?.user_id;
            if (userId) {
              const supabaseUrl = process.env.SUPABASE_URL;
              const supabaseKey = process.env.SUPABASE_ANON_KEY;
              if (supabaseUrl && supabaseKey) {
                const supabase = createClient(supabaseUrl, supabaseKey);
                // Upgrade to pro and give 10 credits
                const { error } = await supabase.rpc("upgrade_user_to_pro", { user_id: userId, extra_credits: 10 });
                if (error) {
                  console.error("Failed to upgrade user:", error);
                }
              }
            }
          }
        }

        return Response.json({ ok: true });
      },
    },
  },
});

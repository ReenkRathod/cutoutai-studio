import { createFileRoute } from "@tanstack/react-router";
import { createRazorpayOrder } from "@/lib/razorpay-handlers";

/** @deprecated Prefer POST /api/create-order */
export const Route = createFileRoute("/api/razorpay/create-order")({
  server: {
    handlers: {
      POST: ({ request }) => createRazorpayOrder(request),
    },
  },
});

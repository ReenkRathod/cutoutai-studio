import { createFileRoute } from "@tanstack/react-router";
import { verifyRazorpayPayment } from "@/lib/razorpay-handlers";

/** @deprecated Prefer POST /api/verify-payment */
export const Route = createFileRoute("/api/razorpay/verify-payment")({
  server: {
    handlers: {
      POST: ({ request }) => verifyRazorpayPayment(request),
    },
  },
});

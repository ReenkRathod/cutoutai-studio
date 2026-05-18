import { createFileRoute } from "@tanstack/react-router";
import { verifyRazorpayPayment } from "@/lib/razorpay-handlers";

export const Route = createFileRoute("/api/verify-payment")({
  server: {
    handlers: {
      POST: ({ request }) => verifyRazorpayPayment(request),
    },
  },
});

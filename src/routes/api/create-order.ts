import { createFileRoute } from "@tanstack/react-router";
import { createRazorpayOrder } from "@/lib/razorpay-handlers";

export const Route = createFileRoute("/api/create-order")({
  server: {
    handlers: {
      POST: ({ request }) => createRazorpayOrder(request),
    },
  },
});

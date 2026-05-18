declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: (response: unknown) => void) => void;
    };
  }
}

let razorpayCheckoutScriptPromise: Promise<void> | null = null;

export function loadRazorpayCheckoutScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Razorpay can only be loaded in the browser"));
  }

  if (window.Razorpay) return Promise.resolve();

  if (!razorpayCheckoutScriptPromise) {
    razorpayCheckoutScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load Razorpay Checkout script"));
      document.head.appendChild(script);
    });
  }

  return razorpayCheckoutScriptPromise;
}

export type RazorpaySuccessResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

export type OpenRazorpayCheckoutOptions = {
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
  description: string;
  onSuccess: (response: RazorpaySuccessResponse) => Promise<void>;
  onFailure: (message: string) => void;
  onDismiss: () => void;
};

export async function openRazorpayCheckout(options: OpenRazorpayCheckoutOptions): Promise<void> {
  await loadRazorpayCheckoutScript();

  if (!window.Razorpay) {
    throw new Error("Razorpay Checkout failed to initialize");
  }

  const rzp = new window.Razorpay({
    key: options.keyId,
    amount: options.amount,
    currency: options.currency,
    name: "CutoutAI",
    description: options.description,
    order_id: options.orderId,
    handler: (response: RazorpaySuccessResponse) => {
      void options.onSuccess(response);
    },
    theme: { color: "#7C3AED" },
  });

  rzp.on("payment.failed", (resp: { error?: { description?: string } }) => {
    options.onFailure(resp?.error?.description ?? "Payment failed");
  });

  rzp.on("modal.closed", () => {
    options.onDismiss();
  });

  rzp.open();
}

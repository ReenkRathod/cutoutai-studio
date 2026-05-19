import { useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { openRazorpayCheckout } from "@/lib/razorpay-checkout";

const plans = [
  {
    name: "Free",
    price: "₹0",
    period: "/forever",
    desc: "For trying it out and personal use.",
    features: ["50 images / month", "Standard resolution", "Web app access", "Community support"],
    cta: "Get Started",
    highlight: false,
    amountInRupees: 0,
  },
  {
    name: "Pro",
    price: "₹1599",
    period: "/month",
    desc: "For creators and small teams.",
    features: ["2,000 images / month", "4K resolution", "Batch processing", "API access (10k calls)", "Priority support"],
    cta: "Upgrade to Pro",
    highlight: true,
    amountInRupees: 1599,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    desc: "For large teams with custom needs.",
    features: ["Unlimited images", "Dedicated infrastructure", "SLA & SOC2", "Custom AI models", "24/7 support"],
    cta: "Contact Sales",
    highlight: false,
    amountInRupees: 0,
  },
];

export function Pricing() {
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const payWithRazorpay = async (amountInRupees: number, planName: string) => {
    if (checkoutLoading) return;
    setCheckoutError(null);
    setCheckoutLoading(true);

    try {
      const amountPaise = Math.round(amountInRupees * 100);
      const createOrderRes = await fetch("/api/create-order", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          amount: amountPaise,
          currency: "INR",
          receipt: `${planName.toLowerCase()}-${Date.now()}`,
          notes: { plan: planName },
        }),
      });

      if (!createOrderRes.ok) {
        const errBody = (await createOrderRes.json().catch(() => null)) as {
          error?: string;
          details?: unknown;
        } | null;
        const detail =
          typeof errBody?.details === "object" && errBody.details !== null
            ? JSON.stringify(errBody.details)
            : String(errBody?.details ?? "");
        throw new Error(
          errBody?.error
            ? `${errBody.error}${detail ? `: ${detail}` : ""}`
            : `Order creation failed (HTTP ${createOrderRes.status})`,
        );
      }

      const { keyId, order_id, amount, currency } = (await createOrderRes.json()) as {
        keyId: string;
        order_id: string;
        amount: number;
        currency: string;
      };

      const checkoutKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID || keyId;

      await openRazorpayCheckout({
        keyId: checkoutKeyId,
        orderId: order_id,
        amount,
        currency,
        description: `${planName} plan (one-time)`,
        onSuccess: async (response) => {
          try {
            const verifyRes = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify(response),
            });
            const verify = (await verifyRes.json()) as { success?: boolean; verified?: boolean };
            if (!verifyRes.ok || (!verify.success && !verify.verified)) {
              throw new Error("Payment signature verification failed");
            }

            alert("Payment successful! You can now continue.");
            setCheckoutError(null);
          } catch (e) {
            setCheckoutError(e instanceof Error ? e.message : "Payment verification failed");
          } finally {
            setCheckoutLoading(false);
          }
        },
        onFailure: (message) => {
          setCheckoutLoading(false);
          setCheckoutError(message);
        },
        onDismiss: () => {
          setCheckoutLoading(false);
        },
      });
    } catch (e) {
      setCheckoutLoading(false);
      setCheckoutError(e instanceof Error ? e.message : "Payment failed");
    }
  };

  return (
    <section id="pricing" className="px-4 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-sm font-semibold uppercase tracking-wider text-gradient">Pricing</p>
          <h2 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Simple, transparent pricing</h2>
          <p className="mt-4 text-muted-foreground">Start free. Upgrade when you need more power.</p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {plans.map((p, i) => (
            <div
              key={p.name}
              className={`relative rounded-3xl p-8 transition hover:-translate-y-2 animate-fade-in ${
                p.highlight
                  ? "bg-gradient-brand text-white shadow-glow scale-[1.03]"
                  : "glass shadow-soft hover:shadow-glow"
              }`}
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              {p.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-bold text-[var(--neon-purple)] shadow-glow">
                  <Sparkles className="h-3 w-3" /> MOST POPULAR
                </div>
              )}
              <h3 className="text-lg font-semibold">{p.name}</h3>
              <p className={`mt-1 text-sm ${p.highlight ? "text-white/80" : "text-muted-foreground"}`}>{p.desc}</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-5xl font-bold">{p.price}</span>
                <span className={p.highlight ? "text-white/80" : "text-muted-foreground"}>{p.period}</span>
              </div>
              <button
                className={`mt-6 w-full rounded-xl py-3 text-sm font-semibold transition hover:scale-[1.02] ${
                  p.highlight
                    ? "bg-white text-[var(--neon-purple)] shadow-soft"
                    : "bg-gradient-brand text-white shadow-glow"
                }`}
                type="button"
                disabled={checkoutLoading && p.amountInRupees > 0}
                onClick={() => {
                  if (p.amountInRupees > 0) void payWithRazorpay(p.amountInRupees, p.name);
                }}
              >
                {checkoutLoading && p.amountInRupees > 0 ? "Processing..." : p.cta}
              </button>
              <ul className="mt-7 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className={`mt-0.5 h-4 w-4 shrink-0 ${p.highlight ? "text-white" : "text-[var(--neon-purple)]"}`} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {checkoutError && <p className="mt-6 text-center text-xs text-red-400">{checkoutError}</p>}
      </div>
    </section>
  );
}

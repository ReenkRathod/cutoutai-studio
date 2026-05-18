import { z } from "zod";
import { hmacSha256Hex, timingSafeEqual } from "@/lib/razorpay-crypto";

const MIN_AMOUNT_PAISE = 100;

const CreateOrderInput = z
  .object({
    amount: z.number().int().optional(),
    amountInRupees: z.number().finite().positive().optional(),
    currency: z.string().min(3).max(3).default("INR"),
    receipt: z.string().optional(),
    notes: z.record(z.string()).optional(),
  })
  .refine((data) => data.amount != null || data.amountInRupees != null, {
    message: "Provide amount (paise) or amountInRupees",
  });

const VerifyPaymentInput = z.object({
  razorpay_payment_id: z.string().min(1),
  razorpay_order_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

function toBase64(value: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(value, "utf8").toString("base64");
  }
  return btoa(value);
}

function getRazorpayCredentials(): { keyId: string; keySecret: string } | null {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return null;
  return { keyId, keySecret };
}

function resolveAmountPaise(data: z.infer<typeof CreateOrderInput>): number {
  if (data.amount != null) return data.amount;
  return Math.round((data.amountInRupees ?? 0) * 100);
}

export async function createRazorpayOrder(request: Request): Promise<Response> {
  const body = await request.json().catch(() => null);
  const parsed = CreateOrderInput.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid request body", details: parsed.error.issues },
      { status: 400 },
    );
  }

  const credentials = getRazorpayCredentials();
  if (!credentials) {
    return Response.json(
      { error: "Missing Razorpay server environment variables" },
      { status: 500 },
    );
  }

  const amountPaise = resolveAmountPaise(parsed.data);
  if (amountPaise < MIN_AMOUNT_PAISE) {
    return Response.json(
      { error: `amount must be at least ${MIN_AMOUNT_PAISE} paise` },
      { status: 400 },
    );
  }

  const { keyId, keySecret } = credentials;
  const auth = toBase64(`${keyId}:${keySecret}`);

  const razorpayRes = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Basic ${auth}`,
    },
    body: JSON.stringify({
      amount: amountPaise,
      currency: parsed.data.currency,
      receipt: parsed.data.receipt,
      notes: parsed.data.notes,
      payment_capture: 1,
    }),
  });

  const razorpayText = await razorpayRes.text();
  let razorpayJson: unknown = null;
  try {
    razorpayJson = razorpayText ? JSON.parse(razorpayText) : null;
  } catch {
    razorpayJson = null;
  }

  if (razorpayRes.status === 401) {
    return Response.json({ error: "Razorpay authentication failed" }, { status: 401 });
  }

  if (!razorpayRes.ok) {
    return Response.json(
      {
        error: "Failed to create Razorpay order",
        details: razorpayJson ?? razorpayText,
      },
      { status: 500 },
    );
  }

  const order = razorpayJson as { id?: string; amount?: number; currency?: string };
  if (!order?.id) {
    return Response.json({ error: "Unexpected Razorpay response" }, { status: 500 });
  }

  return Response.json({
    keyId,
    order_id: order.id,
    amount: order.amount ?? amountPaise,
    currency: order.currency ?? parsed.data.currency,
  });
}

export async function verifyRazorpayPayment(request: Request): Promise<Response> {
  const body = await request.json().catch(() => null);
  const parsed = VerifyPaymentInput.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid request body", details: parsed.error.issues },
      { status: 400 },
    );
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    return Response.json({ error: "Missing RAZORPAY_KEY_SECRET" }, { status: 500 });
  }

  const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = parsed.data;
  const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expected = (await hmacSha256Hex(keySecret, payload)).toLowerCase();
  const actual = razorpay_signature.toLowerCase();

  if (!timingSafeEqual(expected, actual)) {
    return Response.json({ error: "Invalid payment signature", verified: false }, { status: 400 });
  }

  return Response.json({ success: true, verified: true });
}

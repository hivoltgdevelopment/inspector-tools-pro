// Minimal Supabase Edge Function: create-payment-session (stub)
// Accepts { reportId } and returns a mock checkout URL.
// Replace with real processor integration (e.g., Stripe) in production.

import { serve } from "https://deno.land/std@0.195.0/http/server.ts";

// Stripe server integration using REST API from Deno (no Node SDK required)
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
const STRIPE_PRICE_ID = Deno.env.get("STRIPE_PRICE_ID"); // optional, prefer price-based sessions
const STRIPE_AMOUNT_CENTS = Deno.env.get("STRIPE_AMOUNT_CENTS"); // fallback if no price id
const STRIPE_CURRENCY = Deno.env.get("STRIPE_CURRENCY") ?? "usd";
const SUCCESS_URL = Deno.env.get("SUCCESS_URL") ?? "https://example.com/success";
const CANCEL_URL = Deno.env.get("CANCEL_URL") ?? "https://example.com/cancel";

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
  if (!STRIPE_SECRET_KEY) {
    return json({ error: "Stripe not configured (STRIPE_SECRET_KEY missing)" }, 500);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }
  const b = body as Record<string, unknown>;
  const reportId = typeof b?.reportId === "string" ? (b.reportId as string) : null;
  if (!reportId) return json({ error: "reportId is required" }, 400);

  // Build form body for Stripe Checkout Session
  const form = new URLSearchParams();
  form.set("mode", "payment");
  form.set("success_url", SUCCESS_URL);
  form.set("cancel_url", CANCEL_URL);
  // Attach report metadata
  form.set("metadata[reportId]", reportId);

  if (STRIPE_PRICE_ID) {
    form.set("line_items[0][price]", STRIPE_PRICE_ID);
    form.set("line_items[0][quantity]", "1");
  } else if (STRIPE_AMOUNT_CENTS) {
    form.set("line_items[0][quantity]", "1");
    form.set("line_items[0][price_data][currency]", STRIPE_CURRENCY);
    form.set("line_items[0][price_data][product_data][name]", "Inspection Invoice");
    form.set("line_items[0][price_data][unit_amount]", STRIPE_AMOUNT_CENTS);
  } else {
    return json({ error: "Missing STRIPE_PRICE_ID or STRIPE_AMOUNT_CENTS" }, 500);
  }

  const resp = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
  });

  const payload = (await resp.json()) as { url?: string; error?: unknown };
  if (!resp.ok || !payload.url) {
    return json({ error: "Failed to create Stripe Checkout session", details: payload }, 502);
  }
  return json({ url: payload.url });
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

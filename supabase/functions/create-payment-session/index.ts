// Minimal Supabase Edge Function: create-payment-session (stub)
// Accepts { reportId } and returns a mock checkout URL.
// Replace with real processor integration (e.g., Stripe) in production.

import { serve } from "https://deno.land/std@0.195.0/http/server.ts";

// Stripe server integration using REST API from Deno (no Node SDK required)
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
const DEV_FAKE_CHECKOUT = (Deno.env.get("DEV_FAKE_CHECKOUT") ?? "").toLowerCase() === "true";
const STRIPE_PRICE_ID = Deno.env.get("STRIPE_PRICE_ID"); // optional, prefer price-based sessions
const STRIPE_AMOUNT_CENTS = Deno.env.get("STRIPE_AMOUNT_CENTS"); // fallback if no price id
const STRIPE_CURRENCY = Deno.env.get("STRIPE_CURRENCY") ?? "usd";
const STRIPE_MODE = (Deno.env.get("STRIPE_MODE") ?? "payment").toLowerCase(); // 'payment' | 'subscription'
const SUCCESS_URL = Deno.env.get("SUCCESS_URL") ?? "https://example.com/success";
const CANCEL_URL = Deno.env.get("CANCEL_URL") ?? "https://example.com/cancel";

function withCors(res: Response) {
  const headers = new Headers(res.headers);
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Headers", "authorization, x-client-info, apikey, content-type");
  headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  return new Response(res.body, { status: res.status, headers });
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function isHttpUrl(value: string | undefined | null): boolean {
  if (!value) return false;
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return withCors(new Response(null, { status: 204 }));
  if (req.method !== "POST") return withCors(new Response("Method Not Allowed", { status: 405 }));
  // Basic content-type validation
  const contentType = req.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return withCors(json({ code: "unsupported_media_type", error: "Expected application/json body" }, 415));
  }

  // Dev short‑circuit: allow exercising the flow without Stripe
  if (DEV_FAKE_CHECKOUT) {
    const fake = Deno.env.get("DEV_CHECKOUT_URL") ?? (SUCCESS_URL || "https://example.com/success");
    return withCors(json({ url: fake }, 200));
  }
  if (!STRIPE_SECRET_KEY) {
    return withCors(json({ code: "stripe_not_configured", error: "Stripe not configured (STRIPE_SECRET_KEY missing)" }, 500));
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return withCors(json({ code: "invalid_json", error: "Invalid JSON" }, 400));
  }
  const b = body as Record<string, unknown>;
  const reportId = typeof b?.reportId === "string" ? (b.reportId as string) : null;
  if (!reportId) return withCors(json({ code: "missing_report_id", error: "reportId is required" }, 400));

  // Validate URLs when provided (helps catch config mistakes early)
  if (SUCCESS_URL && !isHttpUrl(SUCCESS_URL)) {
    return withCors(json({ code: "invalid_success_url", error: "SUCCESS_URL must be http(s)" }, 500));
  }
  if (CANCEL_URL && !isHttpUrl(CANCEL_URL)) {
    return withCors(json({ code: "invalid_cancel_url", error: "CANCEL_URL must be http(s)" }, 500));
  }

  // Build form body for Stripe Checkout Session
  const form = new URLSearchParams();
  form.set("mode", STRIPE_MODE);
  form.set("success_url", SUCCESS_URL);
  form.set("cancel_url", CANCEL_URL);
  // Attach report metadata
  form.set("metadata[reportId]", reportId);

  if (STRIPE_MODE === "subscription") {
    // Subscriptions require a recurring price
    if (!STRIPE_PRICE_ID) {
      return withCors(json({ code: "missing_price_id", error: "STRIPE_PRICE_ID is required when STRIPE_MODE=subscription" }, 500));
    }
    form.set("line_items[0][price]", STRIPE_PRICE_ID);
    form.set("line_items[0][quantity]", "1");
  } else {
    // One-time payment
    if (STRIPE_PRICE_ID) {
      form.set("line_items[0][price]", STRIPE_PRICE_ID);
      form.set("line_items[0][quantity]", "1");
    } else if (STRIPE_AMOUNT_CENTS) {
      const amount = parseInt(STRIPE_AMOUNT_CENTS, 10);
      if (!Number.isFinite(amount) || amount <= 0) {
        return withCors(json({ code: "invalid_amount", error: "STRIPE_AMOUNT_CENTS must be a positive integer" }, 500));
      }
      form.set("line_items[0][quantity]", "1");
      form.set("line_items[0][price_data][currency]", STRIPE_CURRENCY);
      form.set("line_items[0][price_data][product_data][name]", "Inspection Invoice");
      form.set("line_items[0][price_data][unit_amount]", String(amount));
    } else {
      return withCors(json({ code: "missing_pricing", error: "Missing STRIPE_PRICE_ID or STRIPE_AMOUNT_CENTS" }, 500));
    }
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
    return withCors(json({ code: "stripe_session_error", error: "Failed to create Stripe Checkout session", details: payload }, 502));
  }
  return withCors(json({ url: payload.url }));
});

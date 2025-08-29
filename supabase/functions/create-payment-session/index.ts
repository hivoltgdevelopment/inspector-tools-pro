// Minimal Supabase Edge Function: create-payment-session (stub)
// Accepts { reportId } and returns a mock checkout URL.
// Replace with real processor integration (e.g., Stripe) in production.

import { serve } from "https://deno.land/std@0.195.0/http/server.ts";

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }
  const b = body as Record<string, unknown>;
  const reportId = typeof b?.reportId === "string" ? (b.reportId as string) : null;
  if (!reportId) return json({ error: "reportId is required" }, 400);

  // Stubbed checkout URL for local/dev testing
  const url = `https://example.com/checkout?reportId=${encodeURIComponent(reportId)}`;
  return json({ url });
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

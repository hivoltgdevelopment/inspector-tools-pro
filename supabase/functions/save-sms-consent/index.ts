// Minimal Supabase Edge Function: save-sms-consent
// - Accepts { name?: string, phone: string, consent: true }
// - Validates input and stores in public.sms_consent using the service role
// - Captures IP/User-Agent for audit trail

import { serve } from "https://deno.land/std@0.195.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// On Supabase Edge Functions, SUPABASE_URL and SUPABASE_ANON_KEY are injected by the platform.
// The service role key must be provided as a custom secret (avoid SUPABASE_* prefix): SERVICE_ROLE_KEY
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error("Missing SUPABASE_URL or SERVICE_ROLE_KEY env var");
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const name = typeof body?.name === "string" ? body.name : null;
  const phone = body?.phone;
  const consent = body?.consent;

  if (typeof phone !== "string" || !/^\+[1-9]\d{1,14}$/.test(phone)) {
    return json({ error: "Invalid phone (E.164 required)" }, 400);
  }
  if (consent !== true) {
    return json({ error: "consent must be true" }, 400);
  }

  // Basic metadata (don't rely on x-forwarded-for for strong auth; it's best-effort)
  const ip = req.headers.get("x-forwarded-for") ?? null;
  const userAgent = req.headers.get("user-agent") ?? null;

  const { error } = await admin.from("sms_consent").insert({
    full_name: name ?? "",
    phone_number: phone,
    consent_given: true,
    ip_address: ip,
    user_agent: userAgent,
  });

  if (error) {
    return json({ error: error.message }, 500);
  }

  return json({ ok: true }, 200);
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

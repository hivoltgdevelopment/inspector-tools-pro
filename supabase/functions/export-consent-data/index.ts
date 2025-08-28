// Minimal Supabase Edge Function: export-consent-data
// - Requires authenticated user with admin role (user.user_metadata.role === 'admin')
// - Returns a CSV export of public.sms_consent using the service role

import { serve } from "https://deno.land/std@0.195.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// SUPABASE_URL and SUPABASE_ANON_KEY are injected by the platform in Edge Functions.
// Provide the service role key via SERVICE_ROLE_KEY (custom secret name).
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!SUPABASE_URL || !ANON_KEY || !SERVICE_ROLE_KEY) {
  throw new Error(
    "Missing SUPABASE_URL, SUPABASE_ANON_KEY, or SERVICE_ROLE_KEY env var",
  );
}

serve(async (req) => {
  if (req.method !== "GET") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return new Response("Unauthorized", { status: 401 });
  }

  // User-context client to check role
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const role = (userData.user.user_metadata as any)?.role;
  if (role !== "admin") {
    return new Response("Forbidden", { status: 403 });
  }

  // Admin client for privileged read
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const { data, error } = await admin
    .from("sms_consent")
    .select("id, created_at, full_name, phone_number, consent_given, ip_address, user_agent")
    .order("created_at", { ascending: false });

  if (error) {
    return new Response("Failed to fetch", { status: 500 });
  }

  const headers = [
    "id",
    "created_at",
    "full_name",
    "phone_number",
    "consent_given",
    "ip_address",
    "user_agent",
  ] as const;

  const csv = [
    headers.join(","),
    ...(data ?? []).map((row: Record<string, unknown>) =>
      headers
        .map((h) => csvEscape(valueToString(row[h as string])))
        .join(",")
    ),
  ].join("\n");

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=consent-data.csv",
      "Cache-Control": "no-store",
    },
  });
});

function valueToString(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "boolean") return v ? "true" : "false";
  return String(v);
}

function csvEscape(s: string): string {
  if (s.includes("\"") || s.includes(",") || s.includes("\n")) {
    return `"${s.replaceAll("\"", '""')}"`;
  }
  return s;
}

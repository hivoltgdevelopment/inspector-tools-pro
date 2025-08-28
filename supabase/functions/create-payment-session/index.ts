import { serve } from "https://deno.land/std/http/server.ts";

serve(async (req) => {
  const { reportId } = await req.json();
  // TODO: Use Stripe or Coinbase Commerce to create a real checkout session
  const placeholderUrl = "https://example.com/checkout/" + reportId;
  return new Response(JSON.stringify({ url: placeholderUrl }), {
    headers: { "Content-Type": "application/json" },
  });
});

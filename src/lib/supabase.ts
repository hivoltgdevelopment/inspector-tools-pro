import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  const missingVars = [
    !supabaseUrl && 'VITE_SUPABASE_URL',
    !supabaseAnonKey && 'VITE_SUPABASE_ANON_KEY',
  ]
    .filter(Boolean)
    .join(', ');

  const message =
    `Supabase configuration error: missing ${missingVars}. ` +
    'Please set the required environment variables.';

  if (typeof document !== 'undefined') {
    document.body.innerHTML = `<p style="font-family: sans-serif;">${message}</p>`;
  }

  throw new Error(message);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

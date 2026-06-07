import { createClient } from "@supabase/supabase-js";

// Fallback values prevent build-time crash when env vars are not yet set
// (e.g. during Vercel's static prerender step). The app won't work without
// real values — add them in Vercel → Settings → Environment Variables.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder-anon-key"
);

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseSecretKey) {
  throw new Error(
    "Missing Supabase admin env vars. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY.",
  );
}

// Node.js <22 has no native WebSocket; load `ws` dynamically so Next.js
// doesn't bundle it and browser type-checking stays clean.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const wsTransport: any =
  typeof WebSocket === "undefined"
    ? // eslint-disable-next-line @typescript-eslint/no-require-imports
      require("ws")
    : undefined;

export const supabaseAdmin = createClient(supabaseUrl, supabaseSecretKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  ...(wsTransport ? { realtime: { transport: wsTransport } } : {}),
});

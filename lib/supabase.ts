import { createClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/env";

const serverEnv = getServerEnv();

export const supabase = createClient(serverEnv.SUPABASE_URL, serverEnv.SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
  },
  global: {
    fetch: (input: RequestInfo | URL, init?: RequestInit) => fetch(input, { ...init, cache: "no-store" }),
  },
});

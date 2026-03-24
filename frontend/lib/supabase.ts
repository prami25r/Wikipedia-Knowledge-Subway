import fs from 'node:fs';
import path from 'node:path';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

let client: SupabaseClient<Database> | null = null;
let rootEnvLoaded = false;

function loadRootEnvFileIfNeeded(): void {
  if (rootEnvLoaded) {
    return;
  }

  rootEnvLoaded = true;

  const hasSupabaseUrl = Boolean(process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL);
  const hasSupabaseKey = Boolean(
    process.env.SUPABASE_ANON_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
  );

  if (hasSupabaseUrl && hasSupabaseKey) {
    return;
  }

  const rootEnvPath = path.resolve(process.cwd(), '..', '.env');
  if (typeof process.loadEnvFile === 'function' && fs.existsSync(rootEnvPath)) {
    process.loadEnvFile(rootEnvPath);
  }
}

function getSupabaseCredentials(): { url: string; key: string } {
  loadRootEnvFileIfNeeded();

  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  if (!url || !key) {
    throw new Error(
      'Missing Supabase environment variables. Set SUPABASE_URL and SUPABASE_ANON_KEY, or NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY.',
    );
  }

  return { url, key };
}

export function getSupabaseClient(): SupabaseClient<Database> {
  if (client) {
    return client;
  }

  const { url, key } = getSupabaseCredentials();
  client = createClient<Database>(url, key, {
    auth: {
      persistSession: false,
    },
    global: {
      fetch: (input: RequestInfo | URL, init?: RequestInit) => fetch(input, { ...init, cache: 'no-store' }),
    },
  });

  return client;
}

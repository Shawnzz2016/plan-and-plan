import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
const STORAGE_MODE_KEY = "planandplan_auth_storage";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

let client: SupabaseClient | null = null;

function getAuthStorage() {
  if (typeof window === "undefined") return undefined;
  const mode = window.localStorage.getItem(STORAGE_MODE_KEY);
  if (mode === "session") return window.sessionStorage;
  return window.localStorage;
}

export function setAuthStorageMode(mode: "local" | "session") {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_MODE_KEY, mode);
  client = null;
}

export function getSupabase() {
  if (!isSupabaseConfigured) return null;
  if (!client) {
    client = createClient(supabaseUrl, supabaseKey, {
      auth: {
        storage: getAuthStorage(),
        persistSession: true,
      },
    });
  }
  return client;
}

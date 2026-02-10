import { getSupabase } from "@/lib/supabaseClient";

type AuditPayload = Record<string, unknown>;

type AuditEntry = {
  user_id: string;
  action: string;
  entity: string;
  entity_id?: string | null;
  payload?: AuditPayload;
};

export async function logAudit(entry: AuditEntry) {
  const supabase = getSupabase();
  if (!supabase) return;
  try {
    await supabase.from("audit_logs").insert({
      user_id: entry.user_id,
      action: entry.action,
      entity: entry.entity,
      entity_id: entry.entity_id ?? null,
      payload: entry.payload ?? null,
    });
  } catch {
    // ignore audit failures
  }
}

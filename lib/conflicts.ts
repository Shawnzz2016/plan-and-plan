import type { EventInput } from "@fullcalendar/core";
import { getSupabase } from "@/lib/supabaseClient";

export async function hasConflicts(params: {
  scheduleId: string;
  dates: string[];
  startTime: string;
  endTime: string;
  excludeCourseId?: string | null;
  excludeEventId?: string | null;
}) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase not configured");
  const { scheduleId, dates, startTime, endTime, excludeCourseId, excludeEventId } = params;
  const startMinutes = toMinutes(startTime);
  const endMinutes = toMinutes(endTime);

  for (const date of dates) {
    const dayStart = `${date}T00:00:00`;
    const dayEnd = `${date}T23:59:59`;
    let query = supabase
      .from("events")
      .select("id,course_id,title,start_time,end_time")
      .eq("schedule_id", scheduleId)
      .eq("is_deleted", false)
      .gte("start_time", dayStart)
      .lte("start_time", dayEnd);
    if (excludeCourseId) {
      query = query.neq("course_id", excludeCourseId);
    }
    if (excludeEventId) {
      query = query.neq("id", excludeEventId);
    }
    const { data, error } = await query;
    if (error) throw error;
    const events = (data ?? []) as EventInput[];
    for (const event of events) {
      const start = toDate(event.start);
      const end = toDate(event.end);
      if (!start || !end) continue;
      const s = start.getHours() * 60 + start.getMinutes();
      const e = end.getHours() * 60 + end.getMinutes();
      if (isOverlapping(startMinutes, endMinutes, s, e)) {
        return true;
      }
    }
  }
  return false;
}

function toDate(value: unknown) {
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (Array.isArray(value) && value.length) {
    const parsed = new Date(value[0] as unknown as string);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

function toMinutes(time: string) {
  const [h, m] = time.split(":");
  return Number(h) * 60 + Number(m);
}

function isOverlapping(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  return Math.max(aStart, bStart) < Math.min(aEnd, bEnd);
}

import type { EventInput } from "@fullcalendar/core";
import type { CourseDraft } from "@/app/components/CourseForm";
import { getSupabase } from "@/lib/supabaseClient";
import { logAudit } from "@/lib/audit";
import { hasConflicts } from "@/lib/conflicts";

const DEFAULT_SCHEDULE_TITLE = "Default";

type EventRow = {
  id: string;
  schedule_id: string;
  course_id: string;
  title: string;
  start_time: string;
  end_time: string;
  location: string | null;
  teacher: string | null;
  note: string | null;
  share_code: string | null;
  signature: string | null;
};

type ShareRow = {
  token: string;
  course_id: string;
  schedule_id: string;
  expires_at: string | null;
};

export function generateCourseCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 8; i += 1) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

function buildDraftSignature(draft: CourseDraft) {
  return [
    draft.title.trim().toLowerCase(),
    draft.startTime ?? "",
    draft.endTime ?? "",
    draft.dateMode,
    draft.dateSingle,
    draft.dateRangeStart,
    draft.dateRangeEnd,
    draft.weekdays.slice().sort().join(","),
    draft.dates.slice().sort().join(","),
    draft.teacher?.trim().toLowerCase() ?? "",
    draft.location?.trim().toLowerCase() ?? "",
    draft.note?.trim().toLowerCase() ?? "",
  ].join("|");
}

function toOffsetDateTime(date: string, time: string) {
  const local = new Date(`${date}T${time}`);
  const pad = (value: number) => String(value).padStart(2, "0");
  const offsetMinutes = -local.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const abs = Math.abs(offsetMinutes);
  const hours = pad(Math.floor(abs / 60));
  const minutes = pad(abs % 60);
  const datePart = local.toISOString().slice(0, 10);
  const timePart = local.toTimeString().slice(0, 8);
  return `${datePart}T${timePart}${sign}${hours}:${minutes}`;
}

function buildEventDates(
  draft: CourseDraft,
  courseId: string,
  shareCode: string,
  scheduleId: string,
  signature: string
) {
  const startTime = draft.startTime ?? "";
  const endTime = draft.endTime ?? "";
  const buildEvent = (date: string) => ({
    schedule_id: scheduleId,
    course_id: courseId,
    title: draft.title,
    start_time: toOffsetDateTime(date, startTime),
    end_time: toOffsetDateTime(date, endTime),
    location: draft.location || null,
    teacher: draft.teacher || null,
    note: draft.note || null,
    share_code: shareCode,
    signature,
  });

  if (draft.dateMode === "single") {
    return [buildEvent(draft.dateSingle)];
  }
  if (draft.dateMode === "multi") {
    return draft.dates.map((date) => buildEvent(date));
  }

  const results: ReturnType<typeof buildEvent>[] = [];
  const start = new Date(draft.dateRangeStart);
  const end = new Date(draft.dateRangeEnd);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return results;
  }
  const daySet = new Set(draft.weekdays);
  const current = new Date(start);
  while (current <= end) {
    if (daySet.has(current.getDay())) {
      const dateStr = current.toISOString().slice(0, 10);
      results.push(buildEvent(dateStr));
    }
    current.setDate(current.getDate() + 1);
  }
  return results;
}

function extractDates(draft: CourseDraft) {
  if (draft.dateMode === "single") return [draft.dateSingle];
  if (draft.dateMode === "multi") return draft.dates;
  const dates: string[] = [];
  const start = new Date(draft.dateRangeStart);
  const end = new Date(draft.dateRangeEnd);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return dates;
  const daySet = new Set(draft.weekdays);
  const current = new Date(start);
  while (current <= end) {
    if (daySet.has(current.getDay())) {
      dates.push(current.toISOString().slice(0, 10));
    }
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

export async function getOrCreateSchedule(userId: string, email?: string | null) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase not configured");

  const { data: profile } = await supabase
    .from("users")
    .select("id")
    .eq("id", userId)
    .maybeSingle();
  if (!profile?.id) {
    await supabase.from("users").insert({
      id: userId,
      email: email ?? null,
    });
  }

  const { data: existing, error } = await supabase
    .from("schedules")
    .select("id")
    .eq("user_id", userId)
    .eq("title", DEFAULT_SCHEDULE_TITLE)
    .maybeSingle();
  if (error) throw error;
  if (existing?.id) return existing.id as string;

  const { data: created, error: createError } = await supabase
    .from("schedules")
    .insert({
      user_id: userId,
      title: DEFAULT_SCHEDULE_TITLE,
      color: "#111827",
    })
    .select("id")
    .single();
  if (createError) throw createError;
  return created.id as string;
}

export async function listEvents(scheduleId: string): Promise<EventInput[]> {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase not configured");

  const { data, error } = await supabase
    .from("events")
    .select(
      "id,schedule_id,course_id,title,start_time,end_time,location,teacher,note,share_code,signature"
    )
    .eq("schedule_id", scheduleId)
    .eq("is_deleted", false)
    .order("start_time", { ascending: true });

  if (error) throw error;
  return (data as EventRow[]).map((row) => ({
    id: row.id,
    title: row.title,
    start: row.start_time,
    end: row.end_time,
    extendedProps: {
      teacher: row.teacher,
      location: row.location,
      note: row.note,
      code: row.share_code,
      courseId: row.course_id,
      signature: row.signature,
      scheduleId: row.schedule_id,
    },
  }));
}

export async function createCourse(
  draft: CourseDraft,
  scheduleId: string,
  userId?: string
): Promise<{ events: EventInput[]; code: string | null; conflict?: boolean }> {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase not configured");

  const signature = buildDraftSignature(draft);
  const { data: existing } = await supabase
    .from("events")
    .select("id")
    .eq("schedule_id", scheduleId)
    .eq("signature", signature)
    .eq("is_deleted", false)
    .limit(1);
  if ((existing ?? []).length > 0) {
    return { events: await listEvents(scheduleId), code: null };
  }

  const dates = extractDates(draft);
  if (
    await hasConflicts({
      scheduleId,
      dates,
      startTime: draft.startTime ?? "",
      endTime: draft.endTime ?? "",
    })
  ) {
    return { events: await listEvents(scheduleId), code: null, conflict: true };
  }

  const courseId = crypto.randomUUID();
  const shareCode = generateCourseCode();
  const rows = buildEventDates(draft, courseId, shareCode, scheduleId, signature);
  if (!rows.length) {
    return { events: await listEvents(scheduleId), code: null };
  }

  const { error: insertError } = await supabase.from("events").insert(rows);
  if (insertError) throw insertError;

  await supabase.from("shares").insert({
    schedule_id: scheduleId,
    course_id: courseId,
    token: shareCode,
  });

  if (userId) {
    await logAudit({
      user_id: userId,
      action: "create",
      entity: "course",
      entity_id: courseId,
      payload: { title: draft.title, code: shareCode },
    });
  }

  return { events: await listEvents(scheduleId), code: shareCode };
}

export async function importCourseByCode(
  token: string,
  scheduleId: string,
  userId?: string
): Promise<EventInput[] | null> {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase not configured");

  const { data: shareRows, error } = await supabase
    .from("shares")
    .select("token,course_id,schedule_id,expires_at")
    .eq("token", token)
    .maybeSingle();
  if (error) throw error;
  if (!shareRows) return null;

  const share = shareRows as ShareRow;
  if (share.expires_at && new Date(share.expires_at) < new Date()) {
    return null;
  }

  const { data: sourceEvents, error: sourceError } = await supabase
    .from("events")
    .select(
      "title,start_time,end_time,location,teacher,note,signature,share_code,course_id"
    )
    .eq("course_id", share.course_id)
    .eq("is_deleted", false)
    .order("start_time", { ascending: true });
  if (sourceError) throw sourceError;
  if (!sourceEvents || sourceEvents.length === 0) return null;

  const signature = (sourceEvents[0] as EventRow).signature || "";
  const { data: existing } = await supabase
    .from("events")
    .select("id")
    .eq("schedule_id", scheduleId)
    .eq("signature", signature)
    .eq("is_deleted", false)
    .limit(1);
  if ((existing ?? []).length > 0) {
    return listEvents(scheduleId);
  }

  const newCourseId = crypto.randomUUID();
  const newCode = generateCourseCode();
  const rows = (sourceEvents as EventRow[]).map((row) => ({
    schedule_id: scheduleId,
    course_id: newCourseId,
    title: row.title,
    start_time: row.start_time,
    end_time: row.end_time,
    location: row.location,
    teacher: row.teacher,
    note: row.note,
    share_code: newCode,
    signature,
  }));

  const { error: insertError } = await supabase.from("events").insert(rows);
  if (insertError) throw insertError;

  await supabase.from("shares").insert({
    schedule_id: scheduleId,
    course_id: newCourseId,
    token: newCode,
  });

  if (userId) {
    await logAudit({
      user_id: userId,
      action: "import",
      entity: "course",
      entity_id: newCourseId,
      payload: { token },
    });
  }

  return listEvents(scheduleId);
}

export async function updateCourseByCode(
  code: string,
  draft: CourseDraft,
  scheduleId: string,
  userId?: string
) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase not configured");

  const { data: shareRows } = await supabase
    .from("shares")
    .select("course_id")
    .eq("token", code)
    .maybeSingle();
  if (!shareRows) return null;

  const courseId = (shareRows as { course_id: string }).course_id;
  const signature = buildDraftSignature(draft);

  const dates = extractDates(draft);
  if (
    await hasConflicts({
      scheduleId,
      dates,
      startTime: draft.startTime ?? "",
      endTime: draft.endTime ?? "",
      excludeCourseId: courseId,
    })
  ) {
    return null;
  }

  const rows = buildEventDates(draft, courseId, code, scheduleId, signature);
  if (!rows.length) return null;

  await supabase
    .from("events")
    .update({ is_deleted: true })
    .eq("course_id", courseId);
  await supabase.from("events").insert(rows);
  await supabase
    .from("events")
    .update({ signature })
    .eq("course_id", courseId);

  if (userId) {
    await logAudit({
      user_id: userId,
      action: "update",
      entity: "course",
      entity_id: courseId,
      payload: { code },
    });
  }

  return listEvents(scheduleId);
}

export async function deleteCourseByCode(code: string, userId?: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase not configured");
  const { data: shareRows } = await supabase
    .from("shares")
    .select("course_id")
    .eq("token", code)
    .maybeSingle();
  if (!shareRows) return null;
  const courseId = (shareRows as { course_id: string }).course_id;
  await supabase
    .from("events")
    .update({ is_deleted: true })
    .eq("course_id", courseId);

  if (userId) {
    await logAudit({
      user_id: userId,
      action: "delete",
      entity: "course",
      entity_id: courseId,
      payload: { code },
    });
  }

  return courseId;
}

export async function deleteEventById(
  eventId: string,
  scheduleId: string,
  userId?: string
) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase not configured");
  await supabase
    .from("events")
    .update({ is_deleted: true })
    .eq("id", eventId)
    .eq("schedule_id", scheduleId);

  if (userId) {
    await logAudit({
      user_id: userId,
      action: "delete_single",
      entity: "event",
      entity_id: eventId,
    });
  }

  return listEvents(scheduleId);
}

export async function updateEventById(
  eventId: string,
  draft: CourseDraft,
  scheduleId: string,
  userId?: string
) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase not configured");
  const dates = extractDates({ ...draft, dateMode: "single" });
  if (
    await hasConflicts({
      scheduleId,
      dates,
      startTime: draft.startTime ?? "",
      endTime: draft.endTime ?? "",
      excludeCourseId: null,
      excludeEventId: eventId,
    })
  ) {
    return null;
  }

  const startTime = draft.startTime ?? "";
  const endTime = draft.endTime ?? "";
  const date = draft.dateSingle;
  const { error } = await supabase
    .from("events")
    .update({
      title: draft.title,
      start_time: toOffsetDateTime(date, startTime),
      end_time: toOffsetDateTime(date, endTime),
      location: draft.location || null,
      teacher: draft.teacher || null,
      note: draft.note || null,
    })
    .eq("id", eventId)
    .eq("schedule_id", scheduleId);
  if (error) throw error;

  if (userId) {
    await logAudit({
      user_id: userId,
      action: "update_single",
      entity: "event",
      entity_id: eventId,
    });
  }

  return listEvents(scheduleId);
}

export async function getDraftByCode(code: string, scheduleId: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase not configured");
  const { data } = await supabase
    .from("events")
    .select(
      "title,start_time,end_time,location,teacher,note,course_id,share_code"
    )
    .eq("schedule_id", scheduleId)
    .eq("share_code", code)
    .eq("is_deleted", false)
    .order("start_time", { ascending: true });
  if (!data || data.length === 0) return null;

  const rows = data as EventRow[];
  const first = rows[0];
  const dates = rows.map((row) => row.start_time.slice(0, 10));
  const start = first.start_time.slice(11, 16);
  const end = first.end_time.slice(11, 16);

  const [startHour, startMinute] = start.split(":");
  const [endHour, endMinute] = end.split(":");

  const uniqueDates = Array.from(new Set(dates));
  const dateMode = uniqueDates.length > 1 ? "multi" : "single";

  return {
    title: first.title,
    dateMode,
    dateSingle: uniqueDates[0] ?? "",
    dateRangeStart: uniqueDates[0] ?? "",
    dateRangeEnd: uniqueDates[uniqueDates.length - 1] ?? "",
    weekdays: [],
    dates: uniqueDates,
    startHour: startHour || "",
    startMinute: startMinute || "",
    endHour: endHour || "",
    endMinute: endMinute || "",
    startTime: start,
    endTime: end,
    location: first.location ?? "",
    teacher: first.teacher ?? "",
    note: first.note ?? "",
  } as CourseDraft;
}

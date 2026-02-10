import type { EventInput } from "@fullcalendar/core";
import type { CourseDraft } from "@/app/components/CourseForm";

const STORAGE_KEY = "planandplan_events";
const CODE_KEY = "planandplan_course_codes";

type StoredEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  extendedProps?: {
    teacher?: string;
    location?: string;
    note?: string;
    code?: string;
    signature?: string;
  };
};

type CodeMap = Record<string, CourseDraft>;

function buildEvent(
  draft: CourseDraft,
  date: string,
  startTime: string,
  endTime: string,
  code?: string,
  signature?: string
): StoredEvent {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: draft.title,
    start: `${date}T${startTime}`,
    end: `${date}T${endTime}`,
    extendedProps: {
      teacher: draft.teacher,
      location: draft.location,
      note: draft.note,
      code,
      signature,
    },
  };
}

export function buildEventDates(
  draft: CourseDraft,
  code?: string,
  signature?: string
): StoredEvent[] {
  const startTime = draft.startTime ?? "";
  const endTime = draft.endTime ?? "";
  if (!startTime || !endTime) return [];

  if (draft.dateMode === "single") {
    return [
      buildEvent(draft, draft.dateSingle, startTime, endTime, code, signature),
    ];
  }
  if (draft.dateMode === "multi") {
    return draft.dates.map((date) =>
      buildEvent(draft, date, startTime, endTime, code, signature)
    );
  }

  const results: StoredEvent[] = [];
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
      results.push(
        buildEvent(draft, dateStr, startTime, endTime, code, signature)
      );
    }
    current.setDate(current.getDate() + 1);
  }
  return results;
}

export function loadStoredEvents(): EventInput[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as StoredEvent[];
    return parsed;
  } catch {
    return [];
  }
}

export function saveStoredEvents(events: EventInput[]) {
  if (typeof window === "undefined") return;
  const clean = events.map((event) => ({
    id: event.id as string,
    title: event.title as string,
    start: event.start as string,
    end: event.end as string,
    extendedProps: (event.extendedProps ?? {}) as StoredEvent["extendedProps"],
  }));
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
}

function loadCodeMap(): CodeMap {
  if (typeof window === "undefined") return {};
  const raw = window.localStorage.getItem(CODE_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as CodeMap;
  } catch {
    return {};
  }
}

function saveCodeMap(map: CodeMap) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CODE_KEY, JSON.stringify(map));
}

export function getDraftByCode(code: string) {
  if (typeof window === "undefined") return null;
  const map = loadCodeMap();
  return map[code] ?? null;
}

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

function hasSignature(events: EventInput[], signature: string) {
  return events.some(
    (event) => (event.extendedProps as { signature?: string })?.signature === signature
  );
}

export function addDraftToStorage(draft: CourseDraft, code?: string) {
  if (typeof window === "undefined") return [];
  const existing = loadStoredEvents();
  const signature = buildDraftSignature(draft);
  if (hasSignature(existing, signature)) {
    return { events: existing, code: null };
  }
  const nextCode = code ?? generateCourseCode();
  const added = buildEventDates(draft, nextCode, signature);
  const next = [...existing, ...added];
  saveStoredEvents(next);

  const codeMap = loadCodeMap();
  codeMap[nextCode] = draft;
  saveCodeMap(codeMap);

  return { events: next, code: nextCode };
}

export function importCourseByCode(code: string) {
  if (typeof window === "undefined") return null;
  const codeMap = loadCodeMap();
  const draft = codeMap[code];
  if (!draft) return null;
  return addDraftToStorage(draft, code);
}

export function updateCourseByCode(code: string, draft: CourseDraft) {
  if (typeof window === "undefined") return null;
  const existing = loadStoredEvents();
  const filtered = existing.filter(
    (event) => (event.extendedProps as { code?: string })?.code !== code
  );
  const signature = buildDraftSignature(draft);
  const rebuilt = buildEventDates(draft, code, signature);
  const next = [...filtered, ...rebuilt];
  saveStoredEvents(next);

  const map = loadCodeMap();
  map[code] = draft;
  saveCodeMap(map);
  return next;
}

export function deleteCourseByCode(code: string) {
  if (typeof window === "undefined") return null;
  const existing = loadStoredEvents();
  const next = existing.filter(
    (event) => (event.extendedProps as { code?: string })?.code !== code
  );
  saveStoredEvents(next);
  const map = loadCodeMap();
  delete map[code];
  saveCodeMap(map);
  return next;
}

export function deleteEventById(id: string) {
  if (typeof window === "undefined") return null;
  const existing = loadStoredEvents();
  const next = existing.filter((event) => event.id !== id);
  saveStoredEvents(next);
  return next;
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import StatusBanner from "@/app/components/StatusBanner";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import CalendarView from "./components/CalendarView";
import type { EventInput } from "@fullcalendar/core";
import type { CourseDraft } from "@/app/components/CourseForm";
import { useLanguage } from "@/app/components/LanguageProvider";
import {
  deleteCourseByCode,
  deleteEventById,
  getDraftByCode,
  getOrCreateSchedule,
  listEvents,
  updateCourseByCode,
  updateEventById,
} from "@/lib/courseApi";
import CourseDetailModal from "@/app/components/CourseDetailModal";
import EditCourseModal from "@/app/components/EditCourseModal";

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<EventInput[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventInput | null>(null);
  const [editingDraft, setEditingDraft] = useState<CourseDraft | null>(null);
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editingMode, setEditingMode] = useState<"single" | "all" | null>(null);
  const [detailMode, setDetailMode] = useState<"edit" | "delete" | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [scheduleId, setScheduleId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "today" | "week" | "upcoming">("all");
  const { t } = useLanguage();

  useEffect(() => {
    const load = async () => {
      if (!isSupabaseConfigured) {
        setError(t("supabaseNotConfigured"));
        return;
      }
      const supabase = getSupabase();
      if (!supabase) {
        setError(t("supabaseNotConfigured"));
        return;
      }
      setLoading(true);
      setError(null);
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        setLoading(false);
        router.replace("/login");
        return;
      }
      setUserId(userData.user.id);
      const id = await getOrCreateSchedule(userData.user.id, userData.user.email);
      setScheduleId(id);
      const list = await listEvents(id);
      setEvents(list);
      setLoading(false);
    };

    load();
  }, [router, t]);

  const handleDateClick = (arg: { dateStr?: string } | unknown) => {
    if (!arg || typeof arg !== "object") return;
    const maybe = arg as { dateStr?: string };
    if (!maybe.dateStr) return;
    setSelectedDate(maybe.dateStr);
  };

  const handleEventClick = (arg: { event?: EventInput } | unknown) => {
    if (!arg || typeof arg !== "object") return;
    const maybe = arg as { event?: EventInput };
    if (!maybe.event) return;
    setSelectedEvent(maybe.event);
  };

  const normalizeDate = (value: Date) => new Date(value.getFullYear(), value.getMonth(), value.getDate());

  const toDate = (value: unknown) => {
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
  };

  const filterEvents = () => {
    const now = new Date();
    const todayStart = normalizeDate(now);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    return events.filter((event) => {
      const title = (event.title as string) || "";
      const teacher = (event.extendedProps as { teacher?: string })?.teacher || "";
      const location = (event.extendedProps as { location?: string })?.location || "";
      const haystack = `${title} ${teacher} ${location}`.toLowerCase();
      if (search && !haystack.includes(search.toLowerCase())) {
        return false;
      }
      const start = toDate(event.start);
      if (!start) return false;
      if (filter === "today") {
        return start >= todayStart && start < todayEnd;
      }
      if (filter === "week") {
        return start >= weekStart && start < weekEnd;
      }
      if (filter === "upcoming") {
        return start >= now;
      }
      return true;
    });
  };

  const filtered = filterEvents();

  const grouped = filtered.reduce<Record<string, EventInput[]>>((acc, event) => {
    const start = toDate(event.start);
    if (!start) return acc;
    const key = start.toISOString().slice(0, 10);
    acc[key] = acc[key] ? [...acc[key], event] : [event];
    return acc;
  }, {});

  const groupKeys = Object.keys(grouped).sort();

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-10 text-zinc-900 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-6xl">
        {error ? <StatusBanner tone="error" message={error} /> : null}
        {successMessage ? (
          <StatusBanner tone="success" message={successMessage} />
        ) : null}
        {loading ? (
          <p className="mt-4 text-sm text-zinc-500">{t("loading")}</p>
        ) : null}

        {events.length === 0 ? (
          <section className="mt-6 rounded-2xl bg-white p-6 text-center shadow sm:p-8">
            <p className="text-sm text-zinc-500">{t("emptyScheduleTip")}</p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button onClick={() => router.push("/add-course")}>
                {t("addCourseManual")}
              </Button>
            </div>
          </section>
        ) : (
          <section className="mt-5 grid gap-6 lg:grid-cols-[2fr,1fr]">
            <div className="rounded-2xl bg-white p-4 shadow sm:p-6">
              <CalendarView
                events={events}
                onDateClick={handleDateClick}
                onEventClick={handleEventClick}
              />
            </div>

            <aside className="rounded-2xl bg-white p-5 shadow sm:p-6">
              <h2 className="text-xl font-medium">{t("scheduleList")}</h2>
              <div className="mt-4 space-y-3">
                <input
                  className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm"
                  placeholder={t("listSearch")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <div className="flex flex-wrap gap-2 text-xs">
                  {(["all", "today", "week", "upcoming"] as const).map((key) => (
                    <button
                      key={key}
                      type="button"
                      className={`rounded-full border px-3 py-1 ${
                        filter === key
                          ? "border-zinc-900 bg-zinc-900 text-white"
                          : "border-zinc-200 text-zinc-600"
                      }`}
                      onClick={() => setFilter(key)}
                    >
                      {key === "all"
                        ? t("filterAll")
                        : key === "today"
                        ? t("filterToday")
                        : key === "week"
                        ? t("filterWeek")
                        : t("filterUpcoming")}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 space-y-4">
                {groupKeys.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-zinc-200 px-4 py-6 text-sm text-zinc-500">
                    {t("emptyCourses")}
                  </div>
                ) : (
                  groupKeys.map((key) => {
                    const dayEvents = grouped[key].sort((a, b) => {
                      const aStart = toDate(a.start);
                      const bStart = toDate(b.start);
                      return (aStart?.getTime() || 0) - (bStart?.getTime() || 0);
                    });
                    const dateLabel = new Date(key).toLocaleDateString();
                    return (
                      <div key={key} className="space-y-2">
                        <div className="text-xs font-medium text-zinc-500">
                          {dateLabel}
                        </div>
                        <div className="space-y-2">
                          {dayEvents.map((event) => {
                            const start = toDate(event.start);
                            const end = toDate(event.end);
                            const timeLabel =
                              start && end
                                ? `${start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - ${end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                                : "";
                            const teacher = (event.extendedProps as { teacher?: string })?.teacher;
                            const location = (event.extendedProps as { location?: string })?.location;
                            return (
                              <div
                                key={event.id as string}
                                className="flex items-start justify-between gap-3 rounded-xl border border-zinc-200 px-3 py-2 text-left text-sm hover:border-zinc-300"
                              >
                                <button
                                  type="button"
                                  className="flex-1 text-left"
                                  onClick={() => {
                                    setDetailMode(null);
                                    setSelectedEvent(event);
                                  }}
                                >
                                  <div className="font-medium text-zinc-900">
                                    {event.title as string}
                                  </div>
                                  <div className="text-xs text-zinc-500">
                                    {timeLabel}
                                    {teacher ? ` · ${teacher}` : ""}
                                    {location ? ` · ${location}` : ""}
                                  </div>
                                </button>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    className="rounded-full border border-zinc-200 px-2 py-0.5 text-xs text-zinc-600 hover:bg-zinc-50"
                                    onClick={() => {
                                      setDetailMode("edit");
                                      setSelectedEvent(event);
                                    }}
                                  >
                                    {t("edit")}
                                  </button>
                                  <button
                                    type="button"
                                    className="rounded-full border border-red-200 px-2 py-0.5 text-xs text-red-600 hover:bg-red-50"
                                    onClick={() => {
                                      setDetailMode("delete");
                                      setSelectedEvent(event);
                                    }}
                                  >
                                    {t("delete")}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </aside>
          </section>
        )}

        <CourseDetailModal
          event={selectedEvent}
          defaultMode={detailMode}
          onClose={() => {
            setSelectedEvent(null);
            setDetailMode(null);
          }}
          onEditSingle={() => {
            const event = selectedEvent;
            if (!event) return;
            const start = toDate(event.start);
            const end = toDate(event.end);
            if (!start || !end) return;
            const date = start.toISOString().slice(0, 10);
            const startHour = String(start.getHours()).padStart(2, "0");
            const startMinute = String(start.getMinutes()).padStart(2, "0");
            const endHour = String(end.getHours()).padStart(2, "0");
            const endMinute = String(end.getMinutes()).padStart(2, "0");
            setEditingDraft({
              title: (event.title as string) || "",
              dateMode: "single",
              dateSingle: date,
              dateRangeStart: date,
              dateRangeEnd: date,
              weekdays: [],
              dates: [date],
              startHour,
              startMinute,
              endHour,
              endMinute,
              startTime: `${startHour}:${startMinute}`,
              endTime: `${endHour}:${endMinute}`,
              location:
                (event.extendedProps as { location?: string })?.location ?? "",
              teacher:
                (event.extendedProps as { teacher?: string })?.teacher ?? "",
              note: (event.extendedProps as { note?: string })?.note ?? "",
            });
            setEditingEventId(String(event.id ?? ""));
            setEditingMode("single");
          }}
          onEditAll={() => {
            const code = (selectedEvent?.extendedProps as { code?: string })?.code;
            if (!code) return;
            const run = async () => {
              if (!scheduleId) return;
              const draft = await getDraftByCode(code, scheduleId);
              if (!draft) return;
              setEditingCode(code);
              setEditingDraft(draft);
              setEditingMode("all");
            };
            run();
          }}
          onDeleteSingle={() => {
            const id = selectedEvent?.id;
            if (!id || !scheduleId) return;
            const run = async () => {
              const next = await deleteEventById(String(id), scheduleId, userId ?? undefined);
              if (next) setEvents(next);
              setSuccessMessage(t("deleteSuccess"));
              window.setTimeout(() => setSuccessMessage(null), 2000);
              setSelectedEvent(null);
            };
            run();
          }}
          onDeleteAll={() => {
            const code = (selectedEvent?.extendedProps as { code?: string })?.code;
            if (!code) return;
            if (!window.confirm(t("deleteConfirm"))) return;
            const run = async () => {
              await deleteCourseByCode(code, userId ?? undefined);
              if (!scheduleId) return;
              const next = await listEvents(scheduleId);
              setEvents(next);
              setSuccessMessage(t("deleteSuccess"));
              window.setTimeout(() => setSuccessMessage(null), 2000);
              setSelectedEvent(null);
            };
            run();
          }}
        />

        <EditCourseModal
          open={Boolean(editingDraft)}
          initialDraft={editingDraft}
          lockDateMode={editingMode === "single" ? "single" : undefined}
          onClose={() => {
            setEditingDraft(null);
            setEditingCode(null);
            setEditingEventId(null);
            setEditingMode(null);
          }}
          onSave={(draft) => {
            const run = async () => {
              if (!scheduleId) return;
              if (editingMode === "single") {
                if (!editingEventId) return;
                const next = await updateEventById(
                  editingEventId,
                  draft,
                  scheduleId,
                  userId ?? undefined
                );
                if (!next) {
                  setError(t("conflictCourse"));
                  return;
                }
                setEvents(next);
                setSuccessMessage(t("updateSuccess"));
                window.setTimeout(() => setSuccessMessage(null), 2000);
              } else {
                if (!editingCode) return;
                const next = await updateCourseByCode(
                  editingCode,
                  draft,
                  scheduleId,
                  userId ?? undefined
                );
                if (!next) {
                  setError(t("conflictCourse"));
                  return;
                }
                setEvents(next);
                setSuccessMessage(t("updateSuccess"));
                window.setTimeout(() => setSuccessMessage(null), 2000);
              }
              setEditingDraft(null);
              setEditingCode(null);
              setEditingEventId(null);
              setEditingMode(null);
              setSelectedEvent(null);
            };
            run();
          }}
        />

      </div>
    </main>
  );
}

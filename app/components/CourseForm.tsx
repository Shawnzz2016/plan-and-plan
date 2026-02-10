"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/app/components/LanguageProvider";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventInput } from "@fullcalendar/core";

export type CourseDraft = {
  title: string;
  dateMode: "single" | "weekly" | "multi";
  dateSingle: string;
  dateRangeStart: string;
  dateRangeEnd: string;
  weekdays: number[];
  dates: string[];
  startHour: string;
  startMinute: string;
  endHour: string;
  endMinute: string;
  startTime?: string;
  endTime?: string;
  location: string;
  teacher: string;
  note: string;
};

export default function CourseForm(props: {
  onSave: (draft: CourseDraft, mode: "save" | "continue") => void;
  onCancel?: () => void;
  showContinue?: boolean;
  initialDraft?: CourseDraft | null;
  lockDateMode?: "single";
}) {
  const { onSave, onCancel, showContinue = true, initialDraft, lockDateMode } = props;
  const { t } = useLanguage();
  const [draft, setDraft] = useState<CourseDraft>({
    title: "",
    dateMode: "single",
    dateSingle: "",
    dateRangeStart: "",
    dateRangeEnd: "",
    weekdays: [],
    dates: [],
    startHour: "",
    startMinute: "",
    endHour: "",
    endMinute: "",
    location: "",
    teacher: "",
    note: "",
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialDraft) {
      setDraft(initialDraft);
    }
  }, [initialDraft]);

  useEffect(() => {
    if (lockDateMode) {
      setDraft((prev) => ({ ...prev, dateMode: lockDateMode }));
    }
  }, [lockDateMode]);

  const update = (key: keyof CourseDraft, value: string) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const toggleWeekday = (day: number) => {
    setDraft((prev) => ({
      ...prev,
      weekdays: prev.weekdays.includes(day)
        ? prev.weekdays.filter((d) => d !== day)
        : [...prev.weekdays, day],
    }));
  };

  const removeDate = (value: string) => {
    setDraft((prev) => ({
      ...prev,
      dates: prev.dates.filter((d) => d !== value),
    }));
  };

  const toggleDate = (value: string) => {
    setDraft((prev) => ({
      ...prev,
      dates: prev.dates.includes(value)
        ? prev.dates.filter((d) => d !== value)
        : [...prev.dates, value],
    }));
  };

  const selectedDateEvents: EventInput[] = draft.dates.map((date) => ({
    id: `sel-${date}`,
    start: date,
    allDay: true,
    display: "background",
    backgroundColor: "#111827",
  }));

  const buildTimes = () => {
    const startTime =
      draft.startHour && draft.startMinute
        ? `${draft.startHour}:${draft.startMinute}`
        : "";
    const endTime =
      draft.endHour && draft.endMinute
        ? `${draft.endHour}:${draft.endMinute}`
        : "";
    return { startTime, endTime };
  };

  const validate = () => {
    setError(null);
    if (!draft.title.trim()) {
      setError(t("needTitle"));
      return false;
    }
    const { startTime, endTime } = buildTimes();
    if (!startTime || !endTime) {
      setError(t("needTime"));
      return false;
    }
    const timeOk =
      new Date(`2000-01-01T${endTime}`).getTime() >
      new Date(`2000-01-01T${startTime}`).getTime();
    if (!timeOk) {
      setError(t("endAfterStart"));
      return false;
    }
    if (draft.dateMode === "single" && !draft.dateSingle) {
      setError(t("needDate"));
      return false;
    }
    if (draft.dateMode === "weekly") {
      if (!draft.dateRangeStart || !draft.dateRangeEnd) {
        setError(t("needDateRange"));
        return false;
      }
      if (draft.weekdays.length === 0) {
        setError(t("needWeekday"));
        return false;
      }
    }
    if (draft.dateMode === "multi" && draft.dates.length === 0) {
      setError(t("needDate"));
      return false;
    }
    return true;
  };

  const reset = () => {
    setDraft({
      title: "",
      dateMode: "single",
      dateSingle: "",
      dateRangeStart: "",
      dateRangeEnd: "",
      weekdays: [],
      dates: [],
      startHour: "",
      startMinute: "",
      endHour: "",
      endMinute: "",
      location: "",
      teacher: "",
      note: "",
    });
    setError(null);
  };

  const handleSave = (mode: "save" | "continue") => {
    if (!validate()) return;
    const { startTime, endTime } = buildTimes();
    onSave({ ...draft, startTime, endTime }, mode);
    if (mode === "continue") {
      reset();
    } else if (onCancel) {
      onCancel();
    }
  };

  return (
    <div className="space-y-3">
      <Input
        placeholder={t("courseTitle")}
        value={draft.title}
        onChange={(e) => update("title", e.target.value)}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs text-zinc-500">{t("courseStart")}</label>
          <div className="flex gap-2">
            <select
              className="h-10 w-full rounded-md border border-zinc-200 bg-white px-2 text-sm"
              value={draft.startHour}
              onChange={(e) => update("startHour", e.target.value)}
            >
              <option value="">--</option>
              {Array.from({ length: 24 }).map((_, i) => {
                const val = String(i).padStart(2, "0");
                return (
                  <option key={val} value={val}>
                    {val}
                  </option>
                );
              })}
            </select>
            <select
              className="h-10 w-full rounded-md border border-zinc-200 bg-white px-2 text-sm"
              value={draft.startMinute}
              onChange={(e) => update("startMinute", e.target.value)}
            >
              <option value="">--</option>
              {[
                "00",
                "05",
                "10",
                "15",
                "20",
                "25",
                "30",
                "35",
                "40",
                "45",
                "50",
                "55",
              ].map((val) => (
                <option key={val} value={val}>
                  {val}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs text-zinc-500">{t("courseEnd")}</label>
          <div className="flex gap-2">
            <select
              className="h-10 w-full rounded-md border border-zinc-200 bg-white px-2 text-sm"
              value={draft.endHour}
              onChange={(e) => update("endHour", e.target.value)}
            >
              <option value="">--</option>
              {Array.from({ length: 24 }).map((_, i) => {
                const val = String(i).padStart(2, "0");
                return (
                  <option key={val} value={val}>
                    {val}
                  </option>
                );
              })}
            </select>
            <select
              className="h-10 w-full rounded-md border border-zinc-200 bg-white px-2 text-sm"
              value={draft.endMinute}
              onChange={(e) => update("endMinute", e.target.value)}
            >
              <option value="">--</option>
              {[
                "00",
                "05",
                "10",
                "15",
                "20",
                "25",
                "30",
                "35",
                "40",
                "45",
                "50",
                "55",
              ].map((val) => (
                <option key={val} value={val}>
                  {val}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs text-zinc-500">{t("courseCycle")}</label>
        {!lockDateMode ? (
          <div className="flex flex-wrap gap-2 text-sm">
            {(["single", "weekly", "multi"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                className={`rounded-full border px-3 py-1 ${
                  draft.dateMode === mode
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : "border-zinc-200 text-zinc-600"
                }`}
                onClick={() => update("dateMode", mode)}
              >
                {mode === "single"
                  ? t("cycleSingle")
                  : mode === "weekly"
                  ? t("cycleWeekly")
                  : t("cycleMulti")}
              </button>
            ))}
          </div>
        ) : null}
        {draft.dateMode === "single" ? (
          <Input
            type="date"
            value={draft.dateSingle}
            onChange={(e) => update("dateSingle", e.target.value)}
          />
        ) : null}
        {draft.dateMode === "weekly" ? (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                type="date"
                value={draft.dateRangeStart}
                onChange={(e) => update("dateRangeStart", e.target.value)}
              />
              <Input
                type="date"
                value={draft.dateRangeEnd}
                onChange={(e) => update("dateRangeEnd", e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                <button
                  key={day}
                  type="button"
                  className={`rounded-full border px-3 py-1 ${
                    draft.weekdays.includes(day)
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-zinc-200 text-zinc-600"
                  }`}
                  onClick={() => toggleWeekday(day)}
                >
                  {t(`weekday${day}`)}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        {draft.dateMode === "multi" ? (
          <div className="space-y-2">
            <div className="overflow-hidden rounded-xl border border-zinc-200">
              <FullCalendar
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                height={320}
                headerToolbar={{ left: "prev,next", center: "title", right: "" }}
                events={selectedDateEvents}
                dateClick={(arg) => toggleDate(arg.dateStr)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {draft.dates.map((date) => (
                <button
                  key={date}
                  type="button"
                  className="rounded-full border border-zinc-200 px-3 py-1 text-xs text-zinc-600"
                  onClick={() => removeDate(date)}
                >
                  {date} ×
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <Input
        placeholder={t("courseLocation")}
        value={draft.location}
        onChange={(e) => update("location", e.target.value)}
      />
      <Input
        placeholder={t("courseTeacher")}
        value={draft.teacher}
        onChange={(e) => update("teacher", e.target.value)}
      />
      <Input
        placeholder={t("courseNote")}
        value={draft.note}
        onChange={(e) => update("note", e.target.value)}
      />

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      <div className="mt-6 flex items-center justify-end gap-3">
        {onCancel ? (
          <Button variant="outline" onClick={onCancel}>
            {t("cancel")}
          </Button>
        ) : null}
        {showContinue ? (
          <Button variant="outline" onClick={() => handleSave("continue")}>
            {t("saveAndContinue")}
          </Button>
        ) : null}
        <Button onClick={() => handleSave("save")}>{t("save")}</Button>
      </div>
    </div>
  );
}

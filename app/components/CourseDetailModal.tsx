"use client";

import { useLanguage } from "@/app/components/LanguageProvider";
import { useEffect, useState } from "react";

type CourseEventLike = {
  title?: string;
  start?: Date | string | null;
  end?: Date | string | null;
  extendedProps?: Record<string, unknown> | null;
  id?: string | null;
};

export default function CourseDetailModal(props: {
  event: CourseEventLike | null;
  onClose: () => void;
  onEditSingle: () => void;
  onEditAll: () => void;
  onDeleteSingle: () => void;
  onDeleteAll: () => void;
  defaultMode?: "edit" | "delete" | null;
}) {
  const {
    event,
    onClose,
    onEditSingle,
    onEditAll,
    onDeleteSingle,
    onDeleteAll,
    defaultMode,
  } = props;
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    setDeleteMode(false);
    setCopied(false);
    setEditMode(false);
    if (defaultMode === "edit") {
      setEditMode(true);
    }
    if (defaultMode === "delete") {
      setDeleteMode(true);
    }
  }, [event?.id, defaultMode]);

  if (!event) return null;

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

  const start = toDate(event.start);
  const end = toDate(event.end);
  const format = (value: Date | null) => (value ? value.toLocaleString() : "-");

  const teacher = (event.extendedProps?.teacher as string) || "-";
  const location = (event.extendedProps?.location as string) || "-";
  const note = (event.extendedProps?.note as string) || "-";
  const code = (event.extendedProps?.code as string) || "-";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{t("courseDetail")}</h3>
          <button
            className="text-sm text-zinc-500 hover:text-zinc-900"
            onClick={onClose}
          >
            {t("close")}
          </button>
        </div>

        <div className="mt-5 space-y-3 text-sm text-zinc-700">
          <div className="rounded-lg bg-zinc-50 px-3 py-2">
            <div className="text-xs text-zinc-500">{t("courseTitle")}</div>
            <div className="text-zinc-900">{event.title || "-"}</div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-zinc-50 px-3 py-2">
              <div className="text-xs text-zinc-500">{t("courseStart")}</div>
              <div className="text-zinc-900">{format(start)}</div>
            </div>
            <div className="rounded-lg bg-zinc-50 px-3 py-2">
              <div className="text-xs text-zinc-500">{t("courseEnd")}</div>
              <div className="text-zinc-900">{format(end)}</div>
            </div>
          </div>
          <div className="rounded-lg bg-zinc-50 px-3 py-2">
            <div className="text-xs text-zinc-500">{t("courseTeacher")}</div>
            <div className="text-zinc-900">{teacher}</div>
          </div>
          <div className="rounded-lg bg-zinc-50 px-3 py-2">
            <div className="text-xs text-zinc-500">{t("courseLocation")}</div>
            <div className="text-zinc-900">{location}</div>
          </div>
          <div className="rounded-lg bg-zinc-50 px-3 py-2">
            <div className="text-xs text-zinc-500">{t("courseNote")}</div>
            <div className="text-zinc-900">{note}</div>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2">
            <div>
              <div className="text-xs text-zinc-500">{t("courseCode")}</div>
              <div className="text-zinc-900">{code}</div>
            </div>
            <button
              className="text-xs text-zinc-600 hover:text-zinc-900"
              onClick={() => {
                if (!code || code === "-") return;
                navigator.clipboard?.writeText(code);
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1500);
              }}
            >
              {copied ? t("copied") : t("copy")}
            </button>
          </div>
          {deleteMode ? (
            <div className="space-y-2">
              <div className="text-xs text-zinc-500">{t("deleteChoose")}</div>
              <div className="flex items-center justify-end gap-2">
                <button
                  className="rounded-full border border-zinc-200 px-3 py-1 text-xs text-zinc-600 hover:bg-zinc-50"
                  onClick={() => {
                    setDeleteMode(false);
                  }}
                >
                  {t("cancel")}
                </button>
                <button
                  className="rounded-full border border-zinc-200 px-3 py-1 text-xs text-zinc-600 hover:bg-zinc-50"
                  onClick={onDeleteSingle}
                >
                  {t("deleteSingle")}
                </button>
                <button
                  className="rounded-full border border-red-200 px-3 py-1 text-xs text-red-600 hover:bg-red-50"
                  onClick={onDeleteAll}
                >
                  {t("deleteAll")}
                </button>
              </div>
            </div>
          ) : editMode ? (
            <div className="space-y-2">
              <div className="text-xs text-zinc-500">{t("editChoose")}</div>
              <div className="flex items-center justify-end gap-2">
                <button
                  className="rounded-full border border-zinc-200 px-3 py-1 text-xs text-zinc-600 hover:bg-zinc-50"
                  onClick={() => setEditMode(false)}
                >
                  {t("cancel")}
                </button>
                <button
                  className="rounded-full border border-zinc-200 px-3 py-1 text-xs text-zinc-600 hover:bg-zinc-50"
                  onClick={onEditSingle}
                >
                  {t("editSingle")}
                </button>
                <button
                  className="rounded-full border border-zinc-200 px-3 py-1 text-xs text-zinc-600 hover:bg-zinc-50"
                  onClick={onEditAll}
                >
                  {t("editAll")}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-end gap-2">
              <button
                className="rounded-full border border-zinc-200 px-3 py-1 text-xs text-zinc-600 hover:bg-zinc-50"
                onClick={() => setEditMode(true)}
              >
                {t("edit")}
              </button>
              <button
                className="rounded-full border border-red-200 px-3 py-1 text-xs text-red-600 hover:bg-red-50"
                onClick={() => setDeleteMode(true)}
              >
                {t("delete")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

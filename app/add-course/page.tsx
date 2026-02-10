"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CourseForm, { CourseDraft } from "@/app/components/CourseForm";
import { useLanguage } from "@/app/components/LanguageProvider";
import { createCourse, importCourseByCode, getOrCreateSchedule } from "@/lib/courseApi";
import { getSupabase } from "@/lib/supabaseClient";
import StatusBanner from "@/app/components/StatusBanner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function AddCoursePage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [success, setSuccess] = useState(false);
  const [importCode, setImportCode] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [scheduleId, setScheduleId] = useState<string | null>(null);

  const ensureSchedule = async () => {
    if (scheduleId) return scheduleId;
    const supabase = getSupabase();
    if (!supabase) throw new Error(t("supabaseNotConfigured"));
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id;
    if (!userId) throw new Error(t("supabaseNotConfigured"));
    const id = await getOrCreateSchedule(userId, data.user?.email);
    setScheduleId(id);
    return id;
  };

  const handleSave = (_draft: CourseDraft, mode: "save" | "continue") => {
    const run = async () => {
      const id = await ensureSchedule();
      const supabase = getSupabase();
      const { data } = await supabase!.auth.getUser();
      const result = await createCourse(_draft, id, data.user?.id);
      if (result.code === null) {
        setImportError(t("duplicateCourse"));
        return;
      }
      if (result.conflict) {
        setImportError(t("conflictCourse"));
        return;
      }
      setSuccess(true);
      window.setTimeout(() => setSuccess(false), 2000);
      if (mode === "save") {
        router.push("/dashboard");
      }
    };
    run();
  };

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-10 text-zinc-900 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-2xl">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">{t("addCourseTitle")}</h1>
        </header>
        {success ? (
          <div className="mt-4">
            <StatusBanner tone="success" message={t("saveSuccess")} />
          </div>
        ) : null}
        {importError ? (
          <div className="mt-4">
            <StatusBanner tone="error" message={importError} />
          </div>
        ) : null}
        <section className="mt-6 rounded-2xl bg-white p-6 shadow sm:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              placeholder={t("importByCode")}
              value={importCode}
              onChange={(e) => setImportCode(e.target.value.toUpperCase())}
            />
            <Button
              variant="outline"
              onClick={() => {
                setImportError(null);
                const code = importCode.trim();
                if (!code) return;
                const run = async () => {
                  const id = await ensureSchedule();
                  const supabase = getSupabase();
                  const { data } = await supabase!.auth.getUser();
                  const result = await importCourseByCode(code, id, data.user?.id);
                  if (!result) {
                    setImportError(t("importNotFound"));
                    return;
                  }
                  setImportCode("");
                  setSuccess(true);
                  window.setTimeout(() => setSuccess(false), 2000);
                };
                run();
              }}
            >
              {t("import")}
            </Button>
          </div>
        </section>
        <section className="mt-6 rounded-2xl bg-white p-6 shadow sm:p-8">
          <CourseForm
            onSave={handleSave}
            onCancel={() => router.push("/dashboard")}
            showContinue
          />
        </section>
      </div>
    </main>
  );
}

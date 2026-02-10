"use client";

import CourseForm, { type CourseDraft } from "@/app/components/CourseForm";
import { useLanguage } from "@/app/components/LanguageProvider";

export default function EditCourseModal(props: {
  open: boolean;
  initialDraft: CourseDraft | null;
  onClose: () => void;
  onSave: (draft: CourseDraft) => void;
  lockDateMode?: "single";
}) {
  const { open, onClose, onSave, initialDraft, lockDateMode } = props;
  const { t } = useLanguage();

  if (!open || !initialDraft) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{t("edit")}</h3>
          <button
            className="text-sm text-zinc-500 hover:text-zinc-900"
            onClick={onClose}
          >
            {t("cancel")}
          </button>
        </div>
        <div className="mt-5">
          <CourseForm
            initialDraft={initialDraft}
            onSave={(draft) => onSave(draft)}
            onCancel={onClose}
            showContinue={false}
            lockDateMode={lockDateMode}
          />
        </div>
      </div>
    </div>
  );
}

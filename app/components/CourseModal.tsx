"use client";

import CourseForm, { type CourseDraft } from "@/app/components/CourseForm";
import { useLanguage } from "@/app/components/LanguageProvider";

export default function CourseModal(props: {
  open: boolean;
  onClose: () => void;
  onSave: (draft: CourseDraft) => void;
}) {
  const { open, onClose, onSave } = props;
  const { t } = useLanguage();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{t("addCourseTitle")}</h3>
          <button
            className="text-sm text-zinc-500 hover:text-zinc-900"
            onClick={onClose}
          >
            {t("cancel")}
          </button>
        </div>
        <div className="mt-5">
          <CourseForm
            onSave={(draft) => onSave(draft)}
            onCancel={onClose}
            showContinue={false}
          />
        </div>
      </div>
    </div>
  );
}

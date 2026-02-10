import { useLanguage } from "@/app/components/LanguageProvider";

type FilterValue = "all" | "active" | "done";

export default function FilterBar(props: {
  filter: FilterValue;
  onChange: (value: FilterValue) => void;
}) {
  const { filter, onChange } = props;
  const { t } = useLanguage();

  return (
    <div className="flex gap-2">
      <button
        className={`rounded-lg px-3 py-1 text-sm ${
          filter === "all" ? "bg-black text-white" : "border border-zinc-200"
        }`}
        onClick={() => onChange("all")}
      >
        {t("filterAll")}
      </button>
      <button
        className={`rounded-lg px-3 py-1 text-sm ${
          filter === "active" ? "bg-black text-white" : "border border-zinc-200"
        }`}
        onClick={() => onChange("active")}
      >
        {t("filterActive")}
      </button>
      <button
        className={`rounded-lg px-3 py-1 text-sm ${
          filter === "done" ? "bg-black text-white" : "border border-zinc-200"
        }`}
        onClick={() => onChange("done")}
      >
        {t("filterDone")}
      </button>
    </div>
  );
}

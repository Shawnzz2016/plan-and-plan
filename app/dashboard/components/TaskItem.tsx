import { useLanguage } from "@/app/components/LanguageProvider";

type Task = { id: string; text: string; done: boolean };

export default function TaskItem(props: {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
}) {
  const { task, onToggle, onDelete, onEdit } = props;
  const { t } = useLanguage();

  return (
    <li className="flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-2">
      <button
        className={`text-left ${
          task.done ? "text-zinc-400 line-through" : ""
        }`}
        onClick={() => onToggle(task.id)}
      >
        {task.text}
      </button>
      <div className="flex items-center gap-3">
        <button
          className="text-sm text-zinc-600"
          onClick={() => onEdit(task)}
        >
          {t("taskEdit")}
        </button>
        <button
          className="text-sm text-red-600"
          onClick={() => onDelete(task.id)}
        >
          {t("taskDelete")}
        </button>
      </div>
    </li>
  );
}

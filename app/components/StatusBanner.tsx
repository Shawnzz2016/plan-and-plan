type StatusTone = "error" | "success" | "info";

const toneStyles: Record<StatusTone, string> = {
  error: "border-red-200 bg-red-50 text-red-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  info: "border-zinc-200 bg-zinc-50 text-zinc-700",
};

export default function StatusBanner(props: {
  tone: StatusTone;
  message: string;
}) {
  const { tone, message } = props;

  return (
    <div
      className={`mt-4 rounded-lg border px-3 py-2 text-sm ${toneStyles[tone]}`}
      role={tone === "error" ? "alert" : "status"}
      aria-live="polite"
    >
      {message}
    </div>
  );
}

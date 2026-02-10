"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import StatusBanner from "@/app/components/StatusBanner";
import { useLanguage } from "@/app/components/LanguageProvider";

export default function ForgotPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const { t, lang, setLang } = useLanguage();

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-12 text-zinc-900 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-lg">
        <section className="rounded-3xl bg-white p-6 shadow sm:p-8">
          <div className="flex justify-end">
            <div className="flex items-center rounded-full border border-zinc-200 bg-white p-0.5 text-xs text-zinc-600">
              <button
                type="button"
                className={`rounded-full px-2 py-1 transition ${
                  lang === "zh"
                    ? "bg-zinc-900 text-white"
                    : "hover:bg-zinc-100"
                }`}
                onClick={() => setLang("zh")}
              >
                中文
              </button>
              <button
                type="button"
                className={`rounded-full px-2 py-1 transition ${
                  lang === "en"
                    ? "bg-zinc-900 text-white"
                    : "hover:bg-zinc-100"
                }`}
                onClick={() => setLang("en")}
              >
                EN
              </button>
            </div>
          </div>
          <h2 className="text-2xl font-medium">{t("forgotTitle")}</h2>
          <p className="mt-2 text-sm text-zinc-500">{t("forgotSubtitle")}</p>

          <div className="mt-6 space-y-4">
            <Input
              placeholder={t("emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
            <Button
              className="w-full"
              onClick={async () => {
                setError(null);
                setMessage(null);
                if (!isSupabaseConfigured) {
                  setError(t("supabaseNotConfigured"));
                  return;
                }
                const supabase = getSupabase();
                if (!supabase) {
                  setError(t("supabaseNotConfigured"));
                  return;
                }
                if (!email) {
                  alert(t("enterEmail"));
                  return;
                }
                setLoading(true);
                const { error: resetError } = await supabase.auth.resetPasswordForEmail(
                  email,
                  {
                    redirectTo: `${window.location.origin}/login`,
                  }
                );
                setLoading(false);
                if (resetError) {
                  setError(resetError.message);
                  return;
                }
                setMessage(`${t("forgotSentPrefix")}${email}`);
              }}
              disabled={loading}
            >
              {loading ? t("forgotSending") : t("forgotSend")}
            </Button>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-zinc-500">
            <span>{t("forgotRemember")}</span>
            <Link className="hover:text-zinc-700" href="/login">
              {t("forgotBackLogin")}
            </Link>
          </div>
          {error ? <StatusBanner tone="error" message={error} /> : null}
          {message ? <StatusBanner tone="success" message={message} /> : null}
        </section>
      </div>
    </main>
  );
}

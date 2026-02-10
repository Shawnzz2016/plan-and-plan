"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabase, isSupabaseConfigured, setAuthStorageMode } from "@/lib/supabaseClient";
import StatusBanner from "@/app/components/StatusBanner";
import { useLanguage } from "@/app/components/LanguageProvider";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t, lang, setLang } = useLanguage();

  useEffect(() => {
    const check = async () => {
      if (!isSupabaseConfigured) {
        setError(t("supabaseNotConfigured"));
        return;
      }
      const supabase = getSupabase();
      if (!supabase) return;
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        router.replace("/dashboard");
      }
    };
    check();
  }, [router, t]);

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
          <h2 className="text-2xl font-medium">{t("loginTitle")}</h2>

          <div className="mt-6 space-y-4">
            <Input
              placeholder={t("emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
            <Input
              type="password"
              placeholder={t("passwordPlaceholder")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
            <div className="flex items-center justify-between text-sm text-zinc-600">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-zinc-300"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                {t("loginRemember")}
              </label>
              <Link className="hover:text-zinc-900" href="/forgot">
                {t("loginForgot")}
              </Link>
            </div>
            <Button
              className="w-full"
              onClick={async () => {
                setError(null);
                if (!isSupabaseConfigured) {
                  setError(t("supabaseNotConfigured"));
                  return;
                }
                setAuthStorageMode(rememberMe ? "local" : "session");
                const supabase = getSupabase();
                if (!supabase) {
                  setError(t("supabaseNotConfigured"));
                  return;
                }
                if (!email) {
                  alert(t("enterEmail"));
                  return;
                }
                if (!password) {
                  setError(t("enterPassword"));
                  return;
                }
                setLoading(true);
                const { error: signInError } = await supabase.auth.signInWithPassword(
                  {
                    email,
                    password,
                  }
                );
                setLoading(false);
                if (signInError) {
                  setError(signInError.message);
                  return;
                }
                router.push("/dashboard");
              }}
              disabled={loading}
            >
              {loading ? t("loginLoading") : t("loginButton")}
            </Button>
          </div>

          <div className="mt-4 flex items-center justify-end text-xs text-zinc-500">
            <Link className="hover:text-zinc-700" href="/register">
              {t("loginRegister")}
            </Link>
          </div>
          {error ? <StatusBanner tone="error" message={error} /> : null}
        </section>
      </div>
    </main>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import StatusBanner from "@/app/components/StatusBanner";
import { useLanguage } from "@/app/components/LanguageProvider";

export default function RegisterPage() {
  const [countryCode, setCountryCode] = useState("+63");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
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
          <h2 className="text-2xl font-medium">{t("registerTitle")}</h2>

          <div className="mt-6 space-y-4">
            <div className="flex gap-2">
              <div className="w-28">
                <label className="sr-only">{t("countryCodeLabel")}</label>
                <select
                  className="h-10 w-full rounded-md border border-zinc-200 bg-white px-2 text-sm"
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  disabled={loading}
                >
                  <option value="+63">+63 (PH)</option>
                  <option value="+86">+86 (CN)</option>
                  <option value="+1">+1 (US)</option>
                  <option value="+44">+44 (UK)</option>
                </select>
              </div>
              <Input
                className="flex-1"
                placeholder={t("phonePlaceholder")}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading}
              />
            </div>
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
            <Input
              type="password"
              placeholder={t("confirmPlaceholder")}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
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
                let digits = phone.replace(/\D/g, "");
                const isPH = countryCode === "+63";
                if (isPH && digits.length === 11 && digits.startsWith("0")) {
                  digits = digits.slice(1);
                }
                const isPhoneValid = isPH
                  ? digits.length === 10
                  : digits.length >= 6 && digits.length <= 15;
                if (!digits) {
                  alert(t("enterPhone"));
                  return;
                }
                if (!isPhoneValid) {
                  alert(t("phoneInvalid"));
                  return;
                }
                if (!email) {
                  alert(t("enterEmail"));
                  return;
                }
                if (!password || password !== confirm) {
                  alert(t("confirmPasswordMismatch"));
                  return;
                }
                setLoading(true);
                const { error: signUpError } = await supabase.auth.signUp({
                  email,
                  password,
                  options: {
                    data: {
                      phone: `${countryCode}${digits}`,
                    },
                  },
                });
                setLoading(false);
                if (signUpError) {
                  setError(signUpError.message);
                  return;
                }
                setMessage(t("registerSuccess"));
              }}
              disabled={loading}
            >
              {loading ? t("registerLoading") : t("registerButton")}
            </Button>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-zinc-500">
            <span></span>
            <Link className="hover:text-zinc-700" href="/login">
              {t("registerLogin")}
            </Link>
          </div>
          {error ? <StatusBanner tone="error" message={error} /> : null}
          {message ? <StatusBanner tone="success" message={message} /> : null}
        </section>
      </div>
    </main>
  );
}

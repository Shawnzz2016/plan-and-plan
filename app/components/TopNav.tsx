"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/app/components/LanguageProvider";
import { Settings } from "lucide-react";
import InstallButton from "@/app/components/InstallButton";

export default function TopNav() {
  const [email, setEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const router = useRouter();
  const { lang, setLang, t } = useLanguage();
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const load = async () => {
      const supabase = getSupabase();
      if (!supabase) {
        setEmail(null);
        setUserId(null);
        return;
      }
      const { data } = await supabase.auth.getUser();
      setEmail(data.user?.email ?? null);
      setUserId(data.user?.id ?? null);
    };
    load();

    const supabase = getSupabase();
    if (!supabase) return;
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setEmail(session?.user?.email ?? null);
        setUserId(session?.user?.id ?? null);
        if (session?.user) {
          setMenuOpen(false);
        }
      }
    );
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const check = () => {
      const standalone =
        window.matchMedia?.("(display-mode: standalone)")?.matches ||
        (window.navigator as { standalone?: boolean }).standalone === true;
      setIsStandalone(Boolean(standalone));
    };
    check();
    if (window.matchMedia) {
      const media = window.matchMedia("(display-mode: standalone)");
      const handler = () => check();
      media.addEventListener?.("change", handler);
      return () => media.removeEventListener?.("change", handler);
    }
    return undefined;
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (menuRef.current.contains(event.target as Node)) return;
      setMenuOpen(false);
    };
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [menuOpen]);

  return (
    <header className="border-b bg-white relative z-40">
      <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-4 sm:px-6">
        <button
          type="button"
          className="text-base font-semibold"
          onClick={() => router.push("/dashboard")}
        >
          {t("appName")}
        </button>
        <div className="ml-auto" />
        {email ? (
          <div className="flex items-center gap-2">
            {!isStandalone ? <InstallButton /> : null}
            <div className="relative" ref={menuRef}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label="settings"
            >
              <Settings className="h-4 w-4" />
            </Button>
            {menuOpen ? (
              <div className="absolute right-0 mt-2 w-64 rounded-xl border border-zinc-200 bg-white p-3 text-sm shadow-lg z-50">
                <div className="space-y-2">
                  <div className="rounded-lg bg-zinc-50 px-3 py-2">
                    <div className="text-xs text-zinc-500">{t("userId")}</div>
                    <div className="truncate text-zinc-900">{userId || "-"}</div>
                  </div>
                  <div className="rounded-lg bg-zinc-50 px-3 py-2">
                    <div className="text-xs text-zinc-500">{t("account")}</div>
                    <div className="truncate text-zinc-900">{email}</div>
                  </div>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-zinc-700 hover:bg-zinc-50"
                    onClick={() => {
                      setMenuOpen(false);
                      router.push("/add-course");
                    }}
                  >
                    <span>{t("addCourseManual")}</span>
                  </button>
                  <div className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2">
                    <span className="text-xs text-zinc-500">{t("language")}</span>
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
                  {isStandalone ? (
                    <InstallButton appearance="menu" showWhenInstalled />
                  ) : null}
                  <a
                    className="flex items-center justify-between rounded-lg px-3 py-2 text-zinc-700 hover:bg-zinc-50"
                    href="mailto:shawntoobusy@gmail.com"
                  >
                    <span>{t("feedback")}</span>
                  </a>
                </div>
                <div className="mt-3 border-t border-zinc-100 pt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={async () => {
                      const supabase = getSupabase();
                      if (!supabase) return;
                      await supabase.auth.signOut();
                      setEmail(null);
                      setUserId(null);
                      router.push("/login");
                    }}
                  >
                    {t("logout")}
                  </Button>
                </div>
              </div>
            ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}

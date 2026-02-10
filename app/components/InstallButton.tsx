"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/app/components/LanguageProvider";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export default function InstallButton(props: {
  appearance?: "button" | "menu";
  showWhenInstalled?: boolean;
  labelOverride?: string;
}) {
  const { t } = useLanguage();
  const { appearance = "button", showWhenInstalled = false, labelOverride } = props;
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(
    null
  );
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia?.("(display-mode: standalone)")?.matches ||
      (window.navigator as { standalone?: boolean }).standalone === true;
    if (isStandalone) {
      setInstalled(true);
    }

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
    };

    const onInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (installed && !showWhenInstalled) return;
    if (!promptEvent) {
      alert(t("installHint"));
      return;
    }
    await promptEvent.prompt();
    await promptEvent.userChoice;
    setPromptEvent(null);
  };

  if (installed && !showWhenInstalled) return null;

  const label = labelOverride ?? (installed ? t("installDone") : t("installButton"));

  if (appearance === "menu") {
    return (
      <button
        type="button"
        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-zinc-700 hover:bg-zinc-50"
        onClick={handleInstall}
      >
        <span>{label}</span>
      </button>
    );
  }

  return (
    <Button variant="outline" onClick={handleInstall}>
      {label}
    </Button>
  );
}

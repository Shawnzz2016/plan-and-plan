import type { Metadata } from "next";
import "./globals.css";
import TopNav from "@/app/components/TopNav";
import { LanguageProvider } from "@/app/components/LanguageProvider";
import ServiceWorker from "@/app/components/ServiceWorker";

export const metadata: Metadata = {
  title: "Plan and Plan",
  description: "Plan and Plan schedule / 课程表管理工具",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-zinc-50 text-zinc-900">
        <LanguageProvider>
          <ServiceWorker />
          <TopNav />
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}

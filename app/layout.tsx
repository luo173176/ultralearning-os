import type { Metadata } from "next";

import { t } from "@/lib/i18n";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: t("app.name"),
    template: `%s · ${t("app.name")}`,
  },
  description: t("app.description"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}

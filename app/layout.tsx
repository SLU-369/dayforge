import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "./theme-provider";
import { PlannerProvider } from "./planner-context";
import { AppShell } from "@/components/shell/app-shell";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Dayforge",
  description: "Planejamento diário, rotina semanal e acompanhamento mensal em um só lugar.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

const themeBootstrapScript = `
  (function () {
    var root = document.documentElement;
    var theme = "night";
    try {
      var stored = localStorage.getItem("dayforge:theme:v1");
      theme = stored === "day" || stored === "night"
        ? stored
        : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "night" : "day");
    } catch (_) {
      theme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "night" : "day";
    }
    root.dataset.theme = theme;
    root.style.colorScheme = theme === "night" ? "dark" : "light";
  })();
`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" data-theme="night" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ThemeProvider>
          <PlannerProvider>
            <div className="dayforge-app">
              <div className="theme-backdrop" aria-hidden="true">
                <div className="theme-backdrop-layer theme-backdrop-day" />
                <div className="theme-backdrop-layer theme-backdrop-night" />
                <div className="theme-backdrop-veil theme-backdrop-veil-day" />
                <div className="theme-backdrop-veil theme-backdrop-veil-night" />
                <div className="theme-backdrop-grain" />
              </div>
              <AppShell>{children}</AppShell>
            </div>
          </PlannerProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

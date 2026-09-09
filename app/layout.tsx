import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "./theme-provider";
import { PlannerProvider } from "./planner-context";
import { AppShell } from "@/components/shell/app-shell";
import { CastleBackdrop } from "@/components/appearance/castle-backdrop";
import { bootstrapAppearance } from "./appearance";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Dayforge",
  description: "Planejamento diário, rotina semanal e acompanhamento mensal em um só lugar.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

const themeBootstrapScript = `(${bootstrapAppearance.toString()})();`;

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
              <CastleBackdrop />
              <AppShell>{children}</AppShell>
            </div>
          </PlannerProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

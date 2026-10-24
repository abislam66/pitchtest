import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Inter, Space_Grotesk } from "next/font/google";
import { LogoMark } from "@/components/icons";
import { NavLinks } from "@/components/NavLinks";
import "./globals.css";

const body = Inter({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const heading = Space_Grotesk({ subsets: ["latin"], variable: "--font-heading", display: "swap" });

export const metadata: Metadata = {
  title: "PitchTest",
  description: "Find out which feature real people want you to build first.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f8fb" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0c12" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${body.variable} ${heading.variable}`}>
      <body className="flex min-h-screen flex-col antialiased">
        <a
          href="#main"
          className="btn sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50"
        >
          Skip to content
        </a>
        <header className="sticky top-0 z-40 border-b border-border/70 bg-bg/80 backdrop-blur-md supports-[backdrop-filter]:bg-bg/65">
          <nav aria-label="Main" className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
            <Link href="/" className="flex min-h-11 items-center gap-2.5 rounded-control font-display text-lg font-bold tracking-tight">
              <LogoMark />
              <span>PitchTest</span>
            </Link>
            <NavLinks />
          </nav>
        </header>
        <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
          {children}
        </main>
        <footer className="border-t border-border">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex items-center gap-2.5">
              <LogoMark size={22} />
              <span className="font-display font-semibold text-fg">PitchTest</span>
              <span aria-hidden="true">·</span>
              <span>Build what people actually want.</span>
            </div>
            <p>Borda-count rankings · Payments via Whop · Participants via Terac</p>
          </div>
        </footer>
      </body>
    </html>
  );
}

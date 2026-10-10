import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { ClarityAnalytics } from "@/components/ClarityAnalytics";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AUTHOR, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import { themeScript } from "@/lib/theme";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  authors: [AUTHOR],
  creator: AUTHOR.name,
  title: { default: `${SITE_NAME} · See the algorithm run`, template: `%s · ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: { type: "website", siteName: SITE_NAME, url: "/", title: SITE_NAME, description: SITE_DESCRIPTION },
  twitter: { card: "summary", title: SITE_NAME, description: SITE_DESCRIPTION },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      // The theme script sets data-theme before hydration.
      suppressHydrationWarning
    >
      <head>
        {/* Runs before first paint; see the Next.js "preventing flash before hydration" guide. */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        <ClarityAnalytics />
        <header className="border-b border-fg/10">
          <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
            <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
              {/* Same mark as app/icon.svg. */}
              <svg viewBox="0 0 32 32" className="size-7" aria-hidden="true">
                <rect width="32" height="32" rx="7" fill="#18181b" />
                <path d="M10 10 4.5 16 10 22M22 10l5.5 6-5.5 6" fill="none" stroke="#fbbf24" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M13.5 11.2v9.6a.8.8 0 0 0 1.2.7l7.6-4.8a.8.8 0 0 0 0-1.4l-7.6-4.8a.8.8 0 0 0-1.2.7Z" fill="#fafafa" />
              </svg>
              <span>
                Vis<span className="text-amber-600 dark:text-amber-400">Code</span>
              </span>
            </Link>
            <ThemeToggle />
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">{children}</main>
        <footer className="border-fg/10 border-t">
          <div className="text-fg/50 mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm sm:flex-row">
            <p>
              Built by{" "}
              <a
                href={AUTHOR.url}
                rel="author"
                className="text-fg/80 font-medium underline decoration-amber-500/50 underline-offset-4 transition-colors hover:text-amber-600 dark:hover:text-amber-400"
              >
                {AUTHOR.name}
              </a>
            </p>
            <p className="text-fg/40 text-xs">
              Problems from LeetCode · Blind 75 · Grind 75 · NeetCode 150
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}

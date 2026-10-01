import type { Metadata } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getCurrentUser } from "@/lib/auth/current-user";
import { unreadNotificationCount } from "@/lib/data/notifications";
import { unreadMessageCount } from "@/lib/data/messages";
import { countPendingInvitesForViewer, countUpcomingPlans } from "@/lib/data/invites";
import { LocaleProvider } from "@/components/LocaleProvider";
import { HTML_LANG } from "@/lib/i18n/config";
import { ENGLISH_TABLE, tableFor } from "@/lib/i18n/catalog";
import { getI18n, getLocale } from "@/lib/i18n/server";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: { default: t("meta.title"), template: `%s · ${t("brand.name")}` },
    description: t("meta.description"),
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();
  const devMode = process.env.NODE_ENV !== "production";
  const locale = await getLocale();
  const { t } = await getI18n();
  const [unreadCount, unreadMessages, pendingInvites, upcomingPlans] = user
    ? await Promise.all([
        unreadNotificationCount(user.id),
        unreadMessageCount(user.id),
        countPendingInvitesForViewer(user.id),
        countUpcomingPlans(user.id),
      ])
    : [0, 0, 0, 0];

  return (
    <html
      lang={HTML_LANG[locale]}
      className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-brand focus:px-4 focus:py-2 focus:text-white"
        >
          {t("shell.skip")}
        </a>
        <LocaleProvider locale={locale} table={tableFor(locale)} fallback={ENGLISH_TABLE}>
        <SiteHeader
          user={user ? { name: user.name, role: user.role, isDemoVisitor: user.isDemoVisitor } : null}
          devMode={devMode}
          unreadCount={unreadCount}
          unreadMessages={unreadMessages}
          pendingInvites={pendingInvites}
          upcomingPlans={upcomingPlans}
        />
        <main id="main-content" className="flex flex-1 flex-col">
          {children}
        </main>
        <SiteFooter />
        </LocaleProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getCurrentUser } from "@/lib/auth/current-user";
import { unreadNotificationCount } from "@/lib/data/notifications";
import { unreadMessageCount } from "@/lib/data/messages";
import { countPendingInvitesForViewer } from "@/lib/data/invites";
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

export const metadata: Metadata = {
  title: "Human Network — Prishtina 2036 (demo)",
  description:
    "Find something to do in Prishtina, invite a friend, make a plan, and watch communities collaborate through BRIDGE. A fictional 2036 demo — all people and events are simulated.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();
  const devMode = process.env.NODE_ENV !== "production";
  const [unreadCount, unreadMessages, pendingInvites] = user
    ? await Promise.all([
        unreadNotificationCount(user.id),
        unreadMessageCount(user.id),
        countPendingInvitesForViewer(user.id),
      ])
    : [0, 0, 0];

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-brand focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to main content
        </a>
        <SiteHeader
          user={user ? { name: user.name, role: user.role, isDemoVisitor: user.isDemoVisitor } : null}
          devMode={devMode}
          unreadCount={unreadCount}
          unreadMessages={unreadMessages}
          pendingInvites={pendingInvites}
        />
        <main id="main-content" className="flex flex-1 flex-col">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}

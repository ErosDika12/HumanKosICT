"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { demoLoginAction, logoutAction } from "@/lib/auth/actions";
import { buttonClass } from "@/components/ui";

const NAV_LINKS = [
  { href: "/discover", label: "Discover" },
  { href: "/people", label: "Friends" },
  { href: "/plans", label: "Plans" },
  { href: "/communities", label: "Communities" },
  { href: "/bridge", label: "BRIDGE" },
  { href: "/assistant", label: "Assistant" },
];

export interface SiteHeaderUser {
  name: string;
  role: string;
  isDemoVisitor: boolean;
}

function Badge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -right-1.5 -top-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
      <span className="sr-only">{count} unread </span>
      {count}
    </span>
  );
}

function DemoLoginButton({ size = "sm", className = "" }: { size?: "sm" | "md"; className?: string }) {
  return (
    <form action={demoLoginAction}>
      <button type="submit" className={buttonClass("accent", size, className)}>
        Log in as demo
      </button>
    </form>
  );
}

export function SiteHeader({
  user,
  devMode,
  unreadCount = 0,
  unreadMessages = 0,
  pendingInvites = 0,
}: {
  user: SiteHeaderUser | null;
  devMode: boolean;
  unreadCount?: number;
  unreadMessages?: number;
  pendingInvites?: number;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const roleLabel = user && !user.isDemoVisitor ? user.role.replace(/_/g, " ").toLowerCase() : null;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/85">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 font-display text-lg font-semibold tracking-tight text-foreground">
          <span
            aria-hidden="true"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-sm font-bold text-white shadow-sm"
          >
            HN
          </span>
          <span className="leading-tight">
            Human Network
            <span className="block text-[11px] font-medium uppercase tracking-[0.12em] text-accent-strong">
              Prishtina 2036 · demo
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Main">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href || pathname?.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`relative rounded-full px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-brand-tint text-brand-strong"
                    : "text-foreground-muted hover:bg-surface-muted hover:text-foreground"
                }`}
              >
                {link.label}
                {link.href === "/plans" && <Badge count={pendingInvites} />}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-1.5 lg:flex">
          {user ? (
            <>
              <Link
                href="/messages"
                className="relative rounded-full px-3 py-2 text-sm font-medium text-foreground-muted hover:bg-surface-muted hover:text-foreground"
              >
                Messages
                <Badge count={unreadMessages} />
              </Link>
              <Link
                href="/inbox"
                className="relative rounded-full px-3 py-2 text-sm font-medium text-foreground-muted hover:bg-surface-muted hover:text-foreground"
              >
                Inbox
                <Badge count={unreadCount} />
              </Link>
              <span className="ml-1 max-w-[11rem] truncate text-sm text-foreground-muted" title={user.name}>
                {user.name}
                {user.isDemoVisitor && <span className="ml-1 text-xs">(demo)</span>}
                {roleLabel && <span className="ml-1 text-xs">({roleLabel})</span>}
              </span>
              <form action={logoutAction}>
                <button type="submit" className={buttonClass("secondary", "sm")}>
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className={buttonClass("ghost", "sm")}>
                Staff sign in
              </Link>
              {devMode && (
                <Link href="/dev-login" className="px-2 text-xs font-medium text-foreground-muted underline underline-offset-2">
                  Dev personas
                </Link>
              )}
              <DemoLoginButton />
            </>
          )}
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          {!user && <DemoLoginButton />}
          <button
            type="button"
            className="relative inline-flex items-center justify-center rounded-full border border-border p-2 text-foreground"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              {open ? (
                <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              ) : (
                <path d="M2.5 5h15M2.5 10h15M2.5 15h15" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
              )}
            </svg>
            {!open && <Badge count={unreadMessages + unreadCount + pendingInvites} />}
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-nav" aria-label="Main mobile" className="border-t border-border lg:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between rounded-xl px-3 py-2.5 text-base font-medium text-foreground hover:bg-surface-muted"
              >
                {link.label}
                {link.href === "/plans" && pendingInvites > 0 && (
                  <span className="rounded-full bg-danger px-2 text-xs font-bold text-white">{pendingInvites}</span>
                )}
              </Link>
            ))}
            {user ? (
              <>
                <Link href="/messages" onClick={() => setOpen(false)} className="rounded-xl px-3 py-2.5 text-base font-medium text-foreground hover:bg-surface-muted">
                  Messages {unreadMessages > 0 && `(${unreadMessages})`}
                </Link>
                <Link href="/inbox" onClick={() => setOpen(false)} className="rounded-xl px-3 py-2.5 text-base font-medium text-foreground hover:bg-surface-muted">
                  Inbox {unreadCount > 0 && `(${unreadCount})`}
                </Link>
                <Link href="/impact" onClick={() => setOpen(false)} className="rounded-xl px-3 py-2.5 text-base font-medium text-foreground hover:bg-surface-muted">
                  My impact
                </Link>
                <form action={logoutAction}>
                  <button type="submit" className="w-full rounded-xl px-3 py-2.5 text-left text-base font-medium text-foreground hover:bg-surface-muted">
                    Sign out ({user.name})
                  </button>
                </form>
              </>
            ) : (
              <Link href="/login" onClick={() => setOpen(false)} className="rounded-xl px-3 py-2.5 text-base font-medium text-foreground hover:bg-surface-muted">
                Staff sign in
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}

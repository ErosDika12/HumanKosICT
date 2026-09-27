"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logoutAction } from "@/lib/auth/actions";

const NAV_LINKS = [
  { href: "/discover", labelSq: "Zbulo", labelEn: "Discover" },
  { href: "/onboarding", labelSq: "Interesat", labelEn: "Interests" },
];

export interface SiteHeaderUser {
  name: string;
  role: string;
}

export function SiteHeader({
  user,
  devMode,
}: {
  user: SiteHeaderUser | null;
  devMode: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight text-foreground"
        >
          <span
            aria-hidden="true"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-sm font-bold text-white"
          >
            HN
          </span>
          <span>
            Human Network
            <span className="ml-1.5 hidden text-sm font-normal text-foreground-muted sm:inline">
              — Kosovo 2036
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 sm:flex" aria-label="Main">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href || pathname?.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-brand-tint text-brand-strong"
                    : "text-foreground-muted hover:bg-surface-muted hover:text-foreground"
                }`}
              >
                {link.labelEn}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 sm:flex">
          {user ? (
            <>
              <span className="text-sm text-foreground-muted">
                {user.name} <span className="text-xs">({user.role.replace("_", " ").toLowerCase()})</span>
              </span>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground-muted hover:bg-surface-muted"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground-muted hover:bg-surface-muted"
              >
                Sign in
              </Link>
              {devMode && (
                <Link
                  href="/dev-login"
                  className="rounded-md px-3 py-1.5 text-xs font-medium text-foreground-muted underline underline-offset-2"
                >
                  Dev personas
                </Link>
              )}
            </>
          )}
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md border border-border p-2 text-foreground sm:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            {open ? (
              <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            ) : (
              <path
                d="M2.5 5h15M2.5 10h15M2.5 15h15"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            )}
          </svg>
        </button>
      </div>

      {open && (
        <nav id="mobile-nav" aria-label="Main mobile" className="border-t border-border sm:hidden">
          <div className="flex flex-col gap-1 px-4 py-3">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-base font-medium text-foreground hover:bg-surface-muted"
              >
                {link.labelEn} · {link.labelSq}
              </Link>
            ))}
            {user ? (
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="w-full rounded-md px-3 py-2 text-left text-base font-medium text-foreground hover:bg-surface-muted"
                >
                  Sign out ({user.name})
                </button>
              </form>
            ) : (
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-base font-medium text-foreground hover:bg-surface-muted"
              >
                Sign in
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}

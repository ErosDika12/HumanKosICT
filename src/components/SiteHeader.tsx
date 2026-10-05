"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ComponentType } from "react";
import { demoLoginAction, logoutAction } from "@/lib/auth/actions";
import { buttonClass } from "@/components/ui";
import { useI18n } from "@/components/LocaleProvider";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import {
  BellIcon,
  BridgeIcon,
  CalendarIcon,
  ChatIcon,
  CloseIcon,
  CommunityIcon,
  CompassIcon,
  MenuIcon,
  SparkIcon,
  UserIcon,
  UsersIcon,
} from "@/components/icons";

type IconType = ComponentType<{ size?: number; className?: string }>;

/** The ordinary visitor journey: five destinations, nothing else. */
const CORE_LINKS: { href: string; labelKey: string; Icon: IconType }[] = [
  { href: "/discover", labelKey: "nav.discover", Icon: CompassIcon },
  { href: "/people", labelKey: "nav.friends", Icon: UsersIcon },
  { href: "/plans", labelKey: "nav.plans", Icon: CalendarIcon },
  { href: "/communities", labelKey: "nav.communities", Icon: CommunityIcon },
  { href: "/bridge", labelKey: "nav.bridge", Icon: BridgeIcon },
];

export interface SiteHeaderUser {
  name: string;
  role: string;
  isDemoVisitor: boolean;
}

function Badge({ count, label }: { count: number; label: string }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
      <span className="sr-only">{label} </span>
      {count}
    </span>
  );
}

function isActive(pathname: string | null, href: string) {
  return pathname === href || Boolean(pathname?.startsWith(href + "/"));
}

function DemoLoginButton({ className = "" }: { className?: string }) {
  const { t } = useI18n();
  return (
    <form action={demoLoginAction}>
      <button type="submit" className={buttonClass("accent", "sm", `whitespace-nowrap ${className}`)}>
        {t("action.demoLogin")}
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
  upcomingPlans = 0,
}: {
  user: SiteHeaderUser | null;
  devMode: boolean;
  unreadCount?: number;
  unreadMessages?: number;
  pendingInvites?: number;
  upcomingPlans?: number;
}) {
  const { t } = useI18n();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  // Close menus after navigating and on Escape.
  useEffect(() => {
    const close = () => {
      setMenuOpen(false);
      setUserOpen(false);
    };
    const id = window.requestAnimationFrame(close);
    return () => window.cancelAnimationFrame(id);
  }, [pathname]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setUserOpen(false);
      }
    };
    const onClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
    };
  }, []);

  const planBadge = pendingInvites + upcomingPlans;
  const isStaff = Boolean(user && !user.isDemoVisitor && user.role !== "MEMBER");
  const showModeration = user?.role === "MODERATOR";
  const showMunicipality = user?.role === "MUNICIPALITY_ANALYST";
  const roleLabel = user && !user.isDemoVisitor ? user.role.replace(/_/g, " ").toLowerCase() : null;

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/85">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-2.5 sm:gap-3 sm:px-6">
          <Link href="/" className="flex shrink-0 items-center gap-2.5 font-display text-lg font-semibold tracking-tight text-foreground">
            <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-sm font-bold text-white shadow-sm">
              HN
            </span>
            <span className="leading-tight">
              {t("brand.name")}
              <span className="block text-[11px] font-medium uppercase tracking-[0.12em] text-accent-strong">{t("brand.tagline")}</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-0.5 lg:flex" aria-label={t("shell.mainNav")}>
            {CORE_LINKS.map(({ href, labelKey }) => {
              const active = isActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`relative rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
                    active ? "bg-brand-tint text-brand-strong" : "text-foreground-muted hover:bg-surface-muted hover:text-foreground"
                  }`}
                >
                  {t(labelKey)}
                  {href === "/plans" && <Badge count={planBadge} label={t("nav.plans")} />}
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            <Link
              href="/assistant"
              aria-current={isActive(pathname, "/assistant") ? "page" : undefined}
              title={t("nav.assistant")}
              className="inline-flex items-center rounded-full p-2 text-foreground-muted hover:bg-surface-muted hover:text-foreground"
            >
              <SparkIcon size={18} />
              <span className="sr-only">{t("nav.assistant")}</span>
            </Link>
            <LanguageSwitcher />
            {user ? (
              <>
                <Link href="/messages" className="relative rounded-full p-2 text-foreground-muted hover:bg-surface-muted hover:text-foreground" title={t("nav.messages")}>
                  <ChatIcon />
                  <span className="sr-only">{t("nav.messages")}</span>
                  <Badge count={unreadMessages} label={t("shell.unread", { n: unreadMessages })} />
                </Link>
                <Link href="/inbox" className="relative rounded-full p-2 text-foreground-muted hover:bg-surface-muted hover:text-foreground" title={t("nav.inbox")}>
                  <BellIcon />
                  <span className="sr-only">{t("nav.inbox")}</span>
                  <Badge count={unreadCount} label={t("shell.unread", { n: unreadCount })} />
                </Link>
                <div className="relative" ref={userMenuRef}>
                  <button
                    type="button"
                    aria-expanded={userOpen}
                    onClick={() => setUserOpen((v) => !v)}
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-sm font-medium text-foreground hover:bg-surface-muted"
                  >
                    <UserIcon size={16} />
                    <span className="max-w-[9rem] truncate">{user.name}</span>
                  </button>
                  {userOpen && (
                    <div className="absolute right-0 mt-2 w-60 rounded-2xl border border-border bg-surface p-2 shadow-lg">
                      <p className="px-3 py-2 text-xs text-foreground-muted">
                        {user.isDemoVisitor ? `${t("nav.demoLabel")} · ${t("state.fictional")}` : roleLabel}
                      </p>
                      <MenuLink href="/impact" onNavigate={() => setUserOpen(false)}>{t("nav.progress")}</MenuLink>
                      <MenuLink href="/needs" onNavigate={() => setUserOpen(false)}>{t("nav.needs")}</MenuLink>
                      {isStaff && (
                        <>
                          <p className="mt-1 px-3 pt-2 text-[11px] font-semibold uppercase tracking-wide text-foreground-muted">{t("nav.staff")}</p>
                          {showModeration && <MenuLink href="/moderation" onNavigate={() => setUserOpen(false)}>{t("nav.moderation")}</MenuLink>}
                          {showMunicipality && <MenuLink href="/municipality" onNavigate={() => setUserOpen(false)}>{t("nav.municipality")}</MenuLink>}
                        </>
                      )}
                      <form action={logoutAction}>
                        <button type="submit" className="mt-1 w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-foreground hover:bg-surface-muted">
                          {t("nav.signOut")}
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {devMode && (
                  <Link href="/dev-login" className="px-2 text-xs font-medium text-foreground-muted underline underline-offset-2">
                    {t("nav.devPersonas")}
                  </Link>
                )}
                <DemoLoginButton />
              </>
            )}
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <LanguageSwitcher />
            {!user && (
              <div className="hidden sm:block">
                <DemoLoginButton />
              </div>
            )}
            <button
              type="button"
              className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-border text-foreground"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              onClick={() => setMenuOpen((v) => !v)}
            >
              <span className="sr-only">{menuOpen ? t("shell.closeMenu") : t("shell.openMenu")}</span>
              {menuOpen ? <CloseIcon /> : <MenuIcon />}
              {!menuOpen && <Badge count={unreadMessages + unreadCount} label={t("nav.inbox")} />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav id="mobile-menu" aria-label={t("shell.mobileNav")} className="border-t border-border lg:hidden">
            <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3">
              <MenuLink href="/assistant" onNavigate={() => setMenuOpen(false)}>{t("nav.assistant")}</MenuLink>
              {user ? (
                <>
                  <MenuLink href="/messages" onNavigate={() => setMenuOpen(false)}>
                    {t("nav.messages")} {unreadMessages > 0 && `(${unreadMessages})`}
                  </MenuLink>
                  <MenuLink href="/inbox" onNavigate={() => setMenuOpen(false)}>
                    {t("nav.inbox")} {unreadCount > 0 && `(${unreadCount})`}
                  </MenuLink>
                  <MenuLink href="/impact" onNavigate={() => setMenuOpen(false)}>{t("nav.progress")}</MenuLink>
                  <MenuLink href="/needs" onNavigate={() => setMenuOpen(false)}>{t("nav.needs")}</MenuLink>
                  {showModeration && <MenuLink href="/moderation" onNavigate={() => setMenuOpen(false)}>{t("nav.moderation")}</MenuLink>}
                  {showMunicipality && <MenuLink href="/municipality" onNavigate={() => setMenuOpen(false)}>{t("nav.municipality")}</MenuLink>}
                  <form action={logoutAction}>
                    <button type="submit" className="w-full rounded-xl px-3 py-3 text-left text-base font-medium text-foreground hover:bg-surface-muted">
                      {t("nav.signOut")} ({user.name})
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <MenuLink href="/needs" onNavigate={() => setMenuOpen(false)}>{t("nav.needs")}</MenuLink>
                  <MenuLink href="/login" onNavigate={() => setMenuOpen(false)}>{t("nav.staffSignIn")}</MenuLink>
                  <div className="px-1 pt-1 sm:hidden">
                    <DemoLoginButton className="w-full" />
                  </div>
                </>
              )}
            </div>
          </nav>
        )}
      </header>

      {/* Mobile: the core destinations are always one tap away; Plans carries the live count. */}
      <nav
        aria-label={t("shell.mainNav")}
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      >
        <ul className="mx-auto grid max-w-xl grid-cols-5">
          {CORE_LINKS.map(({ href, labelKey, Icon }) => {
            const active = isActive(pathname, href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`relative flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-medium ${
                    active ? "text-brand-strong" : "text-foreground-muted"
                  }`}
                >
                  <span className="relative">
                    <Icon size={22} />
                    {href === "/plans" && <Badge count={planBadge} label={t("nav.plans")} />}
                  </span>
                  <span className="max-w-full truncate">{t(labelKey)}</span>
                  {active && <span aria-hidden="true" className="absolute inset-x-5 top-0 h-0.5 rounded-full bg-brand" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}

function MenuLink({ href, children, onNavigate }: { href: string; children: React.ReactNode; onNavigate: () => void }) {
  return (
    <Link href={href} onClick={onNavigate} className="block rounded-xl px-3 py-2.5 text-sm font-medium text-foreground hover:bg-surface-muted lg:text-sm">
      {children}
    </Link>
  );
}

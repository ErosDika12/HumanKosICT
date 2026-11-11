import Link from "next/link";
import type { Metadata } from "next";
import { Card, Notice, PageShell, Pill } from "@/components/ui";
import { ArrowIcon } from "@/components/icons";
import { getCurrentUserForRender } from "@/lib/auth/current-user";
import { listActiveNotices, listPublishedServices } from "@/lib/data/city";
import { getI18n } from "@/lib/i18n/server";
import { safeLoad } from "@/lib/safe-load";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("nav.city") };
}

type Section = { key: "services" | "report" | "notices" | "transport" | "participate"; href: string; state: "available" | "empty" | "notConnected" };

export default async function CityPage() {
  const { t } = await getI18n();
  const user = await getCurrentUserForRender();
  const [services, notices] = await Promise.all([
    safeLoad("city-services-count", async () => (await listPublishedServices()).length, 0),
    safeLoad("city-notices-count", async () => (await listActiveNotices()).length, 0),
  ]);

  // Each state reflects what actually exists: a directory with no verified entries says so, and
  // transport/environment stays "not connected" until a permitted source is configured.
  const sections: Section[] = [
    { key: "services", href: "/city/services", state: services.data > 0 ? "available" : "empty" },
    { key: "report", href: "/city/report", state: "available" },
    { key: "notices", href: "/city/notices", state: notices.data > 0 ? "available" : "empty" },
    { key: "transport", href: "/city/transport", state: "notConnected" },
    { key: "participate", href: "/city/proposals", state: "available" },
  ];
  const stateLabel = { available: "city.status.available", empty: "city.status.empty", notConnected: "city.status.notConnected" } as const;

  return (
    <PageShell className="max-w-5xl">
      <header className="flex max-w-2xl flex-col gap-1">
        <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground">{t("city.title")}</h1>
        <p className="text-foreground-muted">{t("city.lead")}</p>
      </header>

      <Notice kind="info">{t("city.independent")}</Notice>
      {(!services.ok || !notices.ok) && <Notice kind="info">{t("state.unavailable.body")}</Notice>}

      <ul className="grid gap-4 sm:grid-cols-2">
        {sections.map(({ key, href, state }) => (
          <li key={key} className="flex">
            <Card className="relative flex w-full flex-col gap-2 p-5 transition-shadow focus-within:shadow-md hover:shadow-md">
              <Pill tone={state === "available" ? "brand" : "neutral"}>{t(stateLabel[state])}</Pill>
              <h2 className="font-display text-xl font-semibold text-foreground">
                <Link href={href} className="after:absolute after:inset-0 after:content-['']">
                  {t(`city.${key}.title`)}
                </Link>
              </h2>
              <p className="text-sm text-foreground-muted">{t(`city.${key}.body`)}</p>
              <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-brand-strong">
                {t("city.open")}
                <ArrowIcon size={16} />
              </span>
            </Card>
          </li>
        ))}
      </ul>

      {user && (user.role === "MODERATOR" || user.role === "MUNICIPALITY_ANALYST") && (
        <Link href="/city/manage" className="w-fit text-sm font-semibold text-brand-strong underline underline-offset-2">
          {t("manage.title")}
        </Link>
      )}
    </PageShell>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Card, Notice, PageShell, Pill } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getMyIssue } from "@/lib/data/issues";
import { getI18n } from "@/lib/i18n/server";
import { neighborhoodBySlug } from "@/lib/neighborhoods";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("city.report.title") };
}

/** A person's own report and its history. Someone else's id renders exactly like a missing one. */
export default async function MyIssuePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ submitted?: string }>;
}) {
  const { id } = await params;
  const { submitted } = await searchParams;
  const { t, shortDate } = await getI18n();
  const user = await getCurrentUser();
  if (!user) notFound();
  const issue = await getMyIssue(user.id, id);
  if (!issue) notFound();
  const area = neighborhoodBySlug(issue.areaSlug);

  return (
    <PageShell className="max-w-2xl">
      <Link href="/city/report" className="text-sm font-medium text-brand-strong hover:underline">
        ← {t("report.mine")}
      </Link>
      {submitted && <Notice kind="ok">{t("report.submitted")}</Notice>}
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Pill tone="brand">{t(`issue.category.${issue.category}`)}</Pill>
          {area && <Pill tone="neutral">{t(`area.${area.areaEn}`)}</Pill>}
          <Pill tone="neutral">{t(`issue.status.${issue.status}`)}</Pill>
        </div>
        <p className="text-foreground">{issue.description}</p>
        <p className="text-sm text-foreground-muted">{t("report.sent", { date: shortDate(issue.createdAt.toISOString().slice(0, 10)) })}</p>
      </header>

      <section aria-labelledby="history-title" className="flex flex-col gap-3">
        <h2 id="history-title" className="font-display text-xl font-semibold text-foreground">
          {t("report.history")}
        </h2>
        <ol className="flex flex-col gap-3">
          {issue.events.map((e, i) => (
            <li key={i}>
              <Card className="flex flex-col gap-1 p-4">
                <span className="font-medium text-foreground">{t(`issue.status.${e.status}`)}</span>
                {e.note && <span className="text-sm text-foreground-muted">{e.note}</span>}
                <span className="text-xs text-foreground-muted">{shortDate(e.createdAt.toISOString().slice(0, 10))}</span>
              </Card>
            </li>
          ))}
        </ol>
      </section>
      <p className="text-sm text-foreground-muted">{t("report.privacy")}</p>
    </PageShell>
  );
}

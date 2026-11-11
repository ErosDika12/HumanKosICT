import Link from "next/link";
import type { Metadata } from "next";
import { SignInPrompt } from "@/components/SignInPrompt";
import { Card, Notice, PageShell, Pill, buttonClass } from "@/components/ui";
import { getCurrentUserForRender } from "@/lib/auth/current-user";
import { reportIssueAction } from "@/lib/actions/city-actions";
import { listMyIssues, publicIssueCounts, type MyIssueView } from "@/lib/data/issues";
import { ISSUE_CATEGORIES, isIssueCategory } from "@/lib/city-config";
import { errorMessage } from "@/lib/i18n/errors";
import { getI18n } from "@/lib/i18n/server";
import { NEIGHBORHOODS } from "@/lib/neighborhoods";
import { safeLoad } from "@/lib/safe-load";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("city.report.title") };
}

const box = "rounded-lg border border-border bg-background px-3 py-2 text-base text-foreground";

export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; category?: string; area?: string; similar?: string; description?: string }>;
}) {
  const sp = await searchParams;
  const { t, shortDate } = await getI18n();
  const user = await getCurrentUserForRender();
  const err = errorMessage(t, sp.error);
  const similar = Number(sp.similar) > 0 ? Number(sp.similar) : 0;

  const [mine, counts] = await Promise.all([
    user ? safeLoad<MyIssueView[]>("my-issues", () => listMyIssues(user.id), []) : Promise.resolve({ ok: true as const, data: [] as MyIssueView[] }),
    safeLoad("issue-counts", () => publicIssueCounts(), []),
  ]);
  const openByArea = new Map<string, number>();
  for (const row of counts.data) {
    if (row.status === "RESOLVED") continue;
    openByArea.set(row.areaSlug, (openByArea.get(row.areaSlug) ?? 0) + row.count);
  }

  return (
    <PageShell className="max-w-3xl">
      <header className="flex max-w-2xl flex-col gap-1">
        <Link href="/city" className="text-sm font-medium text-brand-strong hover:underline">
          ← {t("city.back")}
        </Link>
        <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground">{t("city.report.title")}</h1>
        <p className="text-foreground-muted">{t("report.lead")}</p>
      </header>

      <Notice kind="info">{t("report.notForwarded")}</Notice>
      <p className="text-sm font-medium text-foreground">{t("report.emergency")}</p>

      {err && <Notice kind="error">{err}</Notice>}

      {!user ? (
        <SignInPrompt message={t("report.signIn")} />
      ) : (
        <form id="report-form" action={reportIssueAction} className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5">
          {similar > 0 && <Notice kind="info">{t("report.similar", { n: similar })}</Notice>}
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-foreground">{t("report.category")}</span>
            <select name="category" required defaultValue={isIssueCategory(sp.category) ? sp.category : ""} className={box}>
              <option value="" disabled>
                —
              </option>
              {ISSUE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {t(`issue.category.${c}`)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-foreground">{t("report.area")}</span>
            <select name="areaSlug" required defaultValue={NEIGHBORHOODS.some((n) => n.slug === sp.area) ? sp.area : ""} className={box}>
              <option value="" disabled>
                —
              </option>
              {NEIGHBORHOODS.map((n) => (
                <option key={n.slug} value={n.slug}>
                  {t(`area.${n.areaEn}`)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-foreground">{t("report.description")}</span>
            <textarea name="description" required minLength={10} maxLength={5000} rows={5} defaultValue={sp.description ?? ""} className={box} aria-describedby="report-help" />
            <span id="report-help" className="text-foreground-muted">
              {t("report.descriptionHelp")}
            </span>
          </label>
          <p className="text-sm text-foreground-muted">{t("report.photoNote")}</p>
          {similar > 0 && (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="acknowledgedSimilar" />
              <span>{t("report.similarConfirm")}</span>
            </label>
          )}
          <button type="submit" className={buttonClass("primary", "md", "w-fit")}>
            {t("report.submit")}
          </button>
          <p className="text-sm text-foreground-muted">{t("report.privacy")}</p>
        </form>
      )}

      {user && (
        <section aria-labelledby="mine-title" className="flex flex-col gap-3">
          <h2 id="mine-title" className="font-display text-2xl font-semibold text-foreground">
            {t("report.mine")}
          </h2>
          {mine.data.length === 0 ? (
            <p className="text-foreground-muted">{t("report.none")}</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {mine.data.map((r) => (
                <li key={r.id}>
                  <Card className="relative flex flex-col gap-1 p-4 transition-shadow focus-within:shadow-md hover:shadow-md">
                    <div className="flex flex-wrap items-center gap-2">
                      <Pill tone="brand">{t(`issue.category.${r.category}`)}</Pill>
                      <Pill tone="neutral">{t(`issue.status.${r.status}`)}</Pill>
                    </div>
                    <Link href={`/city/report/${r.id}`} className="font-medium text-foreground after:absolute after:inset-0 after:content-[''] hover:underline">
                      {r.description.length > 90 ? `${r.description.slice(0, 90)}…` : r.description}
                    </Link>
                    <span className="text-sm text-foreground-muted">{t("report.sent", { date: shortDate(r.createdAt.toISOString().slice(0, 10)) })}</span>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section aria-labelledby="counts-title" className="flex flex-col gap-2">
        <h2 id="counts-title" className="font-display text-xl font-semibold text-foreground">
          {t("report.publicCounts")}
        </h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {NEIGHBORHOODS.map((n) => (
            <li key={n.slug} className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-2 text-sm">
              <span>{t(`area.${n.areaEn}`)}</span>
              <span className="font-semibold text-foreground">{openByArea.get(n.slug) ?? 0}</span>
            </li>
          ))}
        </ul>
      </section>
    </PageShell>
  );
}

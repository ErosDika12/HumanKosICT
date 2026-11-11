import Link from "next/link";
import type { Metadata } from "next";
import { SignInPrompt } from "@/components/SignInPrompt";
import { Card, EmptyState, Notice, PageShell, Pill, buttonClass } from "@/components/ui";
import { getCurrentUserForRender } from "@/lib/auth/current-user";
import { createProposalAction, toggleProposalSupportAction } from "@/lib/actions/city-actions";
import { listOpenProposals, type ProposalView } from "@/lib/data/proposals";
import { errorMessage } from "@/lib/i18n/errors";
import { getI18n } from "@/lib/i18n/server";
import { NEIGHBORHOODS, neighborhoodBySlug } from "@/lib/neighborhoods";
import { safeLoad } from "@/lib/safe-load";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("proposals.title") };
}

const box = "rounded-lg border border-border bg-background px-3 py-2 text-base text-foreground";

export default async function ProposalsPage({ searchParams }: { searchParams: Promise<{ error?: string; created?: string }> }) {
  const sp = await searchParams;
  const { t, shortDate } = await getI18n();
  const user = await getCurrentUserForRender();
  const res = await safeLoad<ProposalView[]>("proposals", () => listOpenProposals(user?.id), []);
  const err = errorMessage(t, sp.error);

  return (
    <PageShell className="max-w-3xl">
      <header className="flex max-w-2xl flex-col gap-1">
        <Link href="/city" className="text-sm font-medium text-brand-strong hover:underline">
          ← {t("city.back")}
        </Link>
        <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground">{t("proposals.title")}</h1>
        <p className="text-foreground-muted">{t("proposals.lead")}</p>
      </header>
      <Notice kind="info">{t("proposals.notOfficial")}</Notice>
      {sp.created && <Notice kind="ok">{t("proposals.created")}</Notice>}
      {err && <Notice kind="error">{err}</Notice>}
      {!res.ok && <Notice kind="info">{t("state.unavailable.body")}</Notice>}

      {!user ? (
        <SignInPrompt message={t("proposals.signIn")} />
      ) : (
        <form action={createProposalAction} className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5">
          <h2 className="font-display text-xl font-semibold text-foreground">{t("proposals.new")}</h2>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-foreground">{t("proposals.titleLabel")}</span>
            <input name="title" required maxLength={500} className={box} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-foreground">{t("proposals.bodyLabel")}</span>
            <textarea name="body" required maxLength={5000} rows={4} className={box} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-foreground">{t("proposals.area")}</span>
            <select name="areaSlug" defaultValue="" className={box}>
              <option value="">{t("proposals.areaAny")}</option>
              {NEIGHBORHOODS.map((n) => (
                <option key={n.slug} value={n.slug}>
                  {t(`area.${n.areaEn}`)}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className={buttonClass("primary", "md", "w-fit")}>
            {t("proposals.submit")}
          </button>
        </form>
      )}

      {res.data.length === 0 ? (
        <EmptyState title={t("proposals.empty")} />
      ) : (
        <ul className="flex flex-col gap-4">
          {res.data.map((p) => {
            const area = p.areaSlug ? neighborhoodBySlug(p.areaSlug) : null;
            return (
              <li key={p.id}>
                <Card className="flex flex-col gap-2 p-5">
                  {area && <Pill tone="neutral">{t(`area.${area.areaEn}`)}</Pill>}
                  <h2 className="font-display text-xl font-semibold text-foreground">{p.title}</h2>
                  <p className="text-foreground-muted">{p.body}</p>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="text-sm text-foreground-muted">
                      {t("proposals.supporters", { n: p.supportCount })} · {shortDate(p.createdAt.toISOString().slice(0, 10))}
                    </span>
                    {user && (
                      <form action={toggleProposalSupportAction}>
                        <input type="hidden" name="proposalId" value={p.id} />
                        <button type="submit" aria-pressed={p.isSupportedByViewer} className={buttonClass(p.isSupportedByViewer ? "secondary" : "primary", "sm")}>
                          {p.isSupportedByViewer ? t("proposals.supported") : t("proposals.support")}
                        </button>
                      </form>
                    )}
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </PageShell>
  );
}

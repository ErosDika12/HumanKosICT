import Link from "next/link";
import type { Metadata } from "next";
import { listNeeds, findSimilarOpenNeed } from "@/lib/data/needs";
import { ensureBridgeProposals } from "@/lib/data/bridge";
import { getCurrentUser } from "@/lib/auth/current-user";
import { demoLoginAction } from "@/lib/auth/actions";
import { createNeedAction, toggleNeedSupportAction, reportNeedAction } from "@/lib/actions/need-actions";
import type { ActivityCategory } from "@/lib/types";
import { Pill, buttonClass } from "@/components/ui";
import { PinIcon } from "@/components/icons";
import { getI18n } from "@/lib/i18n/server";
import { areaFromSq } from "@/lib/i18n/areas";
import { localizeText } from "@/lib/i18n/content";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("nav.needs") };
}

const CATEGORIES: ActivityCategory[] = ["technology", "environment", "sports", "education", "culture", "community"];
const field = "rounded-lg border border-border bg-background px-3 py-2 text-base text-foreground";

export default async function NeedsPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string; supported?: string; reported?: string; category?: string; area?: string }>;
}) {
  const { submitted, reported, category, area } = await searchParams;
  const { t, locale } = await getI18n();
  const user = await getCurrentUser();
  await ensureBridgeProposals();
  const needs = await listNeeds(user?.id);
  const similar = category && area ? await findSimilarOpenNeed(category as ActivityCategory, area) : null;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-3xl font-semibold text-foreground">{t("needs.title")}</h1>
        <p className="text-sm text-foreground-muted">{t("needs.lead")}</p>
      </div>

      {submitted && <p className="text-sm text-success">{t("needs.submitted")}</p>}
      {reported && <p className="text-sm text-success">{t("needs.reported")}</p>}

      {user ? (
        <details id="submit-need" open={Boolean(similar)} className="rounded-2xl border border-border bg-surface p-4">
          <summary className="min-h-10 cursor-pointer text-sm font-semibold text-foreground">{t("needs.submit")}</summary>
          <form action={createNeedAction} className="mt-3 flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-foreground">{t("needs.category")}</span>
              <select name="category" defaultValue={category ?? "community"} className={field}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {t(`category.${c}`)}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-foreground">{t("needs.area")}</span>
              <input type="text" name="areaSq" defaultValue={area} placeholder="Prishtinë — Dardania" required className={field} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-foreground">{t("needs.description")}</span>
              <textarea name="description" required rows={3} className={field} />
            </label>
            {similar && (
              <div className="rounded-lg border border-accent bg-accent-tint p-3 text-sm text-foreground">
                <p>{t("needs.similar", { n: similar.supportCount, text: localizeText(similar.description, locale) })}</p>
                <label className="mt-2 flex items-center gap-2">
                  <input type="checkbox" name="acknowledgedSimilar" />
                  {t("needs.similarAnyway")}
                </label>
              </div>
            )}
            <button type="submit" className="inline-flex min-h-10 w-fit items-center justify-center rounded-full bg-brand px-6 py-2 text-sm font-semibold text-white hover:bg-brand-strong">
              {t("needs.send")}
            </button>
          </form>
        </details>
      ) : (
        <form action={demoLoginAction}>
          <button type="submit" className={buttonClass("accent", "md")}>
            {t("needs.login")}
          </button>
        </form>
      )}

      <div className="flex flex-col gap-3">
        {needs.length === 0 ? (
          <p className="text-sm text-foreground-muted">{t("needs.none")}</p>
        ) : (
          needs.map((n) => (
            <div key={n.id} className="rounded-2xl border border-border bg-surface p-4">
              <div className="flex items-center justify-between gap-2">
                <Pill tone="brand">{t(`category.${n.category}`)}</Pill>
                <span className="text-xs text-foreground-muted">{t(`needs.status.${n.status}`)}</span>
              </div>
              <p className="mt-2 text-sm text-foreground">{localizeText(n.description, locale)}</p>
              <p className="mt-1 flex items-center gap-1 text-xs text-foreground-muted">
                <PinIcon size={13} />
                {areaFromSq(n.areaSq, t)}
                {n.communityName && ` · ${n.communityName}`}
              </p>
              {n.bridgeProposalId && (
                <Link href={`/bridge/${n.bridgeProposalId}`} className="mt-1 inline-block py-2 text-sm text-brand-strong underline underline-offset-2">
                  {t("needs.bridgeLink")}
                </Link>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-3">
                {user ? (
                  <form action={toggleNeedSupportAction}>
                    <input type="hidden" name="needId" value={n.id} />
                    <button
                      type="submit"
                      aria-pressed={n.isSupportedByViewer}
                      className={`min-h-9 rounded-full border px-4 py-1 text-xs font-medium ${
                        n.isSupportedByViewer ? "border-brand bg-brand text-white" : "border-border text-foreground-muted hover:bg-surface-muted"
                      }`}
                    >
                      {n.isSupportedByViewer ? t("needs.supported") : t("needs.support")} · {n.supportCount}
                    </button>
                  </form>
                ) : (
                  <span className="text-xs text-foreground-muted">{t("needs.supporters", { n: n.supportCount })}</span>
                )}
                {user && (
                  <form action={reportNeedAction} className="flex items-center gap-1">
                    <input type="hidden" name="needId" value={n.id} />
                    <input
                      type="text"
                      name="reason"
                      required
                      placeholder={t("needs.reportReason")}
                      aria-label={t("needs.reportAria", { text: localizeText(n.description, locale) })}
                      className="rounded-md border border-border bg-background px-2 py-1 text-xs"
                    />
                    <button type="submit" className="text-xs text-foreground-muted underline underline-offset-2">
                      {t("needs.report")}
                    </button>
                  </form>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

import Link from "next/link";
import { AuthorizationError, getCurrentUser, requireRole } from "@/lib/auth/current-user";
import {
  getRealGapRows,
  getTopRealGaps,
  getScenarioGapRows,
  getTopScenarioGaps,
  listCandidateSpaces,
  getRecommendationDraft,
} from "@/lib/data/municipality";
import { MIN_DISTINCT_CONTRIBUTORS, type GapValue } from "@/lib/data/municipality-aggregation";
import { saveRecommendationNoteAction } from "@/lib/actions/municipality-actions";
import { getI18n } from "@/lib/i18n/server";
import { areaFromSq } from "@/lib/i18n/areas";

function gapHeat(value: number): string {
  if (value >= 6) return "bg-danger-tint text-danger";
  if (value >= 3) return "bg-accent-tint text-accent-strong";
  if (value > 0) return "bg-brand-tint text-brand-strong";
  return "bg-surface-muted text-foreground-muted";
}

export default async function MunicipalityPage() {
  const { t } = await getI18n();
  const user = await getCurrentUser();
  if (!user) return <AccessNote message={t("staff.loginAs")} link={<Link href="/login?next=/municipality" className="text-brand-strong underline underline-offset-2">{t("staff.login")}</Link>} />;

  try {
    await requireRole("MUNICIPALITY_ANALYST");
  } catch (err) {
    if (err instanceof AuthorizationError) {
      return <AccessNote message={t("staff.denied.analyst", { role: user.role.toLowerCase() })} />;
    }
    throw err;
  }

  const [realRows, topReal, scenarioRows, topScenario, candidateSpaces] = await Promise.all([
    getRealGapRows(),
    getTopRealGaps(5),
    getScenarioGapRows(),
    getTopScenarioGaps(5),
    listCandidateSpaces(),
  ]);
  const headline = topScenario[0];
  const recommendation = headline ? await getRecommendationDraft(headline.areaSq, headline.category) : null;

  const formatGap = (value: GapValue) => (value.kind === "count" ? String(value.value) : t("muni.suppressed"));
  const area = (a: string) => areaFromSq(a, t);
  const topic = (c: string) => t(`category.${c}`);
  const th = "px-3 py-2";

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-2xl font-semibold text-foreground">{t("muni.title")}</h1>
        <p className="text-sm text-foreground-muted">{t("muni.lead")}</p>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5 text-sm text-foreground-muted">
        <h2 className="font-display text-sm font-semibold text-foreground">{t("muni.how.title")}</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>{t("muni.how.supply")}</li>
          <li>{t("muni.how.demand", { n: MIN_DISTINCT_CONTRIBUTORS })}</li>
          <li>{t("muni.how.window")}</li>
          <li>{t("muni.how.noTotals")}</li>
          <li>{t("muni.how.caveat")}</li>
        </ul>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-semibold text-foreground">
          {t("muni.scenario.title")} <span className="text-xs font-normal text-foreground-muted">({t("muni.scenario.tag")})</span>
        </h2>
        <p className="text-xs text-foreground-muted">{t("muni.scenario.note")}</p>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface-muted text-left text-foreground-muted">
              <tr>
                <th className={th}>{t("muni.col.area")}</th>
                <th className={th}>{t("muni.col.topic")}</th>
                <th className={th}>{t("muni.col.simDemand")}</th>
                <th className={th}>{t("muni.col.supply")}</th>
                <th className={th}>{t("muni.col.gap")}</th>
              </tr>
            </thead>
            <tbody>
              {scenarioRows.map((r) => (
                <tr key={`${r.areaSq}-${r.category}`} className="border-t border-border">
                  <td className={`${th} text-foreground`}>{area(r.areaSq)}</td>
                  <td className={`${th} text-foreground`}>{topic(r.category)}</td>
                  <td className={`${th} text-foreground`}>{r.syntheticDemand}</td>
                  <td className={`${th} text-foreground`}>{r.supply}</td>
                  <td className={`${th} font-medium ${gapHeat(r.gap)}`}>{r.gap}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-foreground-muted">{t("muni.shading")}</p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-semibold text-foreground">
          {t("muni.real.title")} <span className="text-xs font-normal text-foreground-muted">({t("muni.real.tag")})</span>
        </h2>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface-muted text-left text-foreground-muted">
              <tr>
                <th className={th}>{t("muni.col.area")}</th>
                <th className={th}>{t("muni.col.topic")}</th>
                <th className={th}>{t("muni.col.realDemand")}</th>
                <th className={th}>{t("muni.col.supply")}</th>
                <th className={th}>{t("muni.col.gap")}</th>
              </tr>
            </thead>
            <tbody>
              {realRows.map((r) => (
                <tr key={`${r.areaSq}-${r.category}`} className="border-t border-border">
                  <td className={`${th} text-foreground`}>{area(r.areaSq)}</td>
                  <td className={`${th} text-foreground`}>{topic(r.category)}</td>
                  <td className={`${th} text-foreground`}>{formatGap(r.demand)}</td>
                  <td className={`${th} text-foreground`}>{r.supply}</td>
                  <td className={`${th} font-medium text-foreground`}>{formatGap(r.gap)}</td>
                </tr>
              ))}
              {realRows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-4 text-center text-foreground-muted">
                    {t("muni.real.none")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-semibold text-foreground">{t("muni.top.title")}</h2>
        <p className="text-xs text-foreground-muted">{t("muni.top.note")}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {topReal.map((r) => (
            <div key={`real-${r.areaSq}-${r.category}`} className={`rounded-lg p-3 text-sm ${gapHeat(r.gap.value)}`}>
              {t("muni.top.real", { area: area(r.areaSq), topic: topic(r.category), gap: r.gap.value })}
            </div>
          ))}
          {topScenario.map((r) => (
            <div key={`scenario-${r.areaSq}-${r.category}`} className={`rounded-lg p-3 text-sm ${gapHeat(r.gap)}`}>
              {t("muni.top.scenario", { area: area(r.areaSq), topic: topic(r.category), gap: r.gap })}
            </div>
          ))}
          {topReal.length === 0 && topScenario.length === 0 && <p className="text-sm text-foreground-muted">{t("muni.top.none")}</p>}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-semibold text-foreground">{t("muni.places.title")}</h2>
        <p className="text-xs text-foreground-muted">{t("muni.places.note")}</p>
        <ul className="flex flex-col gap-1 text-sm text-foreground-muted">
          {candidateSpaces.map((c) => (
            <li key={`${c.venueName}-${c.areaSq}`}>
              {c.venueName} ({area(c.areaSq)}) — {t("muni.places.count", { n: c.scheduledActivityCount })}
            </li>
          ))}
        </ul>
      </section>

      {headline && recommendation && (
        <section className="rounded-2xl border border-brand bg-brand-tint p-5">
          <h2 className="font-display text-sm font-semibold text-brand-strong">
            {t("muni.suggestion", { area: area(headline.areaSq), topic: topic(headline.category) })}
          </h2>
          {recommendation.updatedByName && <p className="mt-1 text-xs text-foreground-muted">{t("muni.lastEdited", { name: recommendation.updatedByName })}</p>}
          <form action={saveRecommendationNoteAction} className="mt-3 flex flex-col gap-2">
            <input type="hidden" name="areaSq" value={headline.areaSq} />
            <input type="hidden" name="category" value={headline.category} />
            <textarea name="text" defaultValue={recommendation.text} rows={4} className="rounded-lg border border-border bg-background px-3 py-2 text-base text-foreground" />
            <button type="submit" className="inline-flex min-h-10 w-fit items-center justify-center rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-strong">
              {t("muni.saveEdits")}
            </button>
          </form>
        </section>
      )}
    </div>
  );
}

function AccessNote({ message, link }: { message: string; link?: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 py-10 sm:px-6">
      <p className="text-sm text-foreground-muted">
        {message} {link}
      </p>
    </div>
  );
}

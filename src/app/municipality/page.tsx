import Link from "next/link";
import { DemoBadge } from "@/components/DemoBadge";
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

function formatGap(value: GapValue): string {
  return value.kind === "count" ? String(value.value) : "suppressed";
}

function gapHeat(value: number): string {
  if (value >= 6) return "bg-danger-tint text-danger";
  if (value >= 3) return "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100";
  if (value > 0) return "bg-brand-tint text-brand-strong";
  return "bg-surface-muted text-foreground-muted";
}

export default async function MunicipalityPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <AccessNote
        message={
          <>
            <Link href="/login?next=/municipality" className="text-brand underline underline-offset-2">
              Sign in
            </Link>{" "}
            as the municipality analyst persona to view this dashboard.
          </>
        }
      />
    );
  }

  try {
    await requireRole("MUNICIPALITY_ANALYST");
  } catch (err) {
    if (err instanceof AuthorizationError) {
      return (
        <AccessNote
          message={`Access denied — municipality data is analyst-only, aggregate-only. Your account (${user.role.toLowerCase()}) doesn't have that role.`}
        />
      );
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
  const recommendation = headline
    ? await getRecommendationDraft(headline.areaSq, headline.category)
    : null;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-2">
        <DemoBadge className="self-start" />
        <h1 className="font-display text-2xl font-semibold text-foreground">
          Municipality intelligence — demand vs. supply
        </h1>
        <p className="text-sm text-foreground-muted">
          Decision support using anonymous, aggregated <strong>simulated Prishtina 2036</strong>{" "}
          demo data — not surveillance, and not a claim about real Kosovo residents. Every
          recommendation below is a suggestion for human review, never an automatic decision.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-surface p-5 text-sm text-foreground-muted">
        <h2 className="font-display text-sm font-semibold text-foreground">How this is computed</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            <strong>Supply</strong> = real, published activities per area/category — public by
            definition, never suppressed.
          </li>
          <li>
            <strong>Real demand</strong> = distinct people (need submitters + supporters,
            deduplicated) behind currently open/in-progress community needs per area/category.
            Cells with fewer than <strong>{MIN_DISTINCT_CONTRIBUTORS}</strong> distinct
            contributors are shown as &quot;suppressed,&quot; never an exact or near-exact number.
          </li>
          <li>
            <strong>Time window</strong>: the full seeded 2036 demo period — this fictional,
            fixed-calendar prototype has no real ongoing time series to bucket further.
          </li>
          <li>
            No area or grand total is ever computed by summing the category cells below — doing
            so could let someone subtract the visible categories from a total to reconstruct a
            suppressed one (a &quot;differencing&quot; attack). Any total shown is its own
            independent, equally-suppressed aggregation.
          </li>
          <li>
            A suppression threshold is a defensible mitigation, not a formal guarantee — someone
            with outside knowledge of a small area could still narrow things down.
          </li>
        </ul>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-semibold text-foreground">
          Scenario projection <span className="text-xs font-normal text-foreground-muted">(synthetic, for demo-scale storytelling — not derived from real accounts)</span>
        </h2>
        <p className="text-xs text-foreground-muted">
          A separate, explicitly-labeled simulated dataset — large enough to show the product
          story without fabricating individual accounts. Never blended with the real,
          privacy-governed numbers below.
        </p>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface-muted text-left text-foreground-muted">
              <tr>
                <th className="px-3 py-2">Area</th>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2">Simulated demand</th>
                <th className="px-3 py-2">Real supply</th>
                <th className="px-3 py-2">Gap</th>
              </tr>
            </thead>
            <tbody>
              {scenarioRows.map((r) => (
                <tr key={`${r.areaSq}-${r.category}`} className="border-t border-border">
                  <td className="px-3 py-2 text-foreground">{r.areaSq}</td>
                  <td className="px-3 py-2 capitalize text-foreground">{r.category}</td>
                  <td className="px-3 py-2 text-foreground">{r.syntheticDemand}</td>
                  <td className="px-3 py-2 text-foreground">{r.supply}</td>
                  <td className={`px-3 py-2 font-medium ${gapHeat(r.gap)}`}>{r.gap}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-foreground-muted">
          Cell shading reflects gap size (darker = larger simulated gap) — the table above is the
          full accessible equivalent; no information is color-only.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-semibold text-foreground">
          Real aggregate demand <span className="text-xs font-normal text-foreground-muted">(privacy-protected)</span>
        </h2>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface-muted text-left text-foreground-muted">
              <tr>
                <th className="px-3 py-2">Area</th>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2">Real demand</th>
                <th className="px-3 py-2">Real supply</th>
                <th className="px-3 py-2">Gap</th>
              </tr>
            </thead>
            <tbody>
              {realRows.map((r) => (
                <tr key={`${r.areaSq}-${r.category}`} className="border-t border-border">
                  <td className="px-3 py-2 text-foreground">{r.areaSq}</td>
                  <td className="px-3 py-2 capitalize text-foreground">{r.category}</td>
                  <td className="px-3 py-2 text-foreground">{formatGap(r.demand)}</td>
                  <td className="px-3 py-2 text-foreground">{r.supply}</td>
                  <td className="px-3 py-2 font-medium text-foreground">{formatGap(r.gap)}</td>
                </tr>
              ))}
              {realRows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-4 text-center text-foreground-muted">
                    No open community needs right now.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-semibold text-foreground">Top gaps (disclosed only)</h2>
        <p className="text-xs text-foreground-muted">
          Only cells above the suppression threshold are ever ranked — a suppressed cell never
          appears here, at any position.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {topReal.map((r) => (
            <div key={`real-${r.areaSq}-${r.category}`} className={`rounded-lg p-3 text-sm ${gapHeat(r.gap.value)}`}>
              Real: {r.areaSq} · {r.category} — gap {r.gap.value}
            </div>
          ))}
          {topScenario.map((r) => (
            <div key={`scenario-${r.areaSq}-${r.category}`} className={`rounded-lg p-3 text-sm ${gapHeat(r.gap)}`}>
              Scenario: {r.areaSq} · {r.category} — gap {r.gap}
            </div>
          ))}
          {topReal.length === 0 && topScenario.length === 0 && (
            <p className="text-sm text-foreground-muted">No disclosed gaps right now.</p>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-semibold text-foreground">Known public places</h2>
        <p className="text-xs text-foreground-muted">
          Real seeded venues with their real scheduled-activity count. A space is only ever called
          a &quot;candidate space in this scenario&quot; — never &quot;underused&quot; without
          actual usage evidence.
        </p>
        <ul className="flex flex-col gap-1 text-sm text-foreground-muted">
          {candidateSpaces.map((c) => (
            <li key={`${c.venueName}-${c.areaSq}`}>
              {c.venueName} ({c.areaSq}) — {c.scheduledActivityCount} scheduled activit
              {c.scheduledActivityCount === 1 ? "y" : "ies"}
            </li>
          ))}
        </ul>
      </section>

      {headline && recommendation && (
        <section className="rounded-xl border border-brand bg-brand-tint p-5">
          <h2 className="font-display text-sm font-semibold text-brand-strong">
            Suggestion for human review — {headline.areaSq} · {headline.category}
          </h2>
          {recommendation.updatedByName && (
            <p className="mt-1 text-xs text-foreground-muted">
              Last edited by {recommendation.updatedByName}
            </p>
          )}
          <form action={saveRecommendationNoteAction} className="mt-3 flex flex-col gap-2">
            <input type="hidden" name="areaSq" value={headline.areaSq} />
            <input type="hidden" name="category" value={headline.category} />
            <textarea
              name="text"
              defaultValue={recommendation.text}
              rows={4}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
            <button
              type="submit"
              className="inline-flex w-fit items-center justify-center rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-strong"
            >
              Save edits
            </button>
          </form>
        </section>
      )}
    </div>
  );
}

function AccessNote({ message }: { message: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 py-10 sm:px-6">
      <DemoBadge className="self-start" />
      <p className="text-sm text-foreground-muted">{message}</p>
    </div>
  );
}

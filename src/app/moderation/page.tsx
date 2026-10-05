import Link from "next/link";
import { AuthorizationError, getCurrentUser, requireRole } from "@/lib/auth/current-user";
import { listOpenReports } from "@/lib/data/reports";
import { listPendingActivities, listPendingCommunities } from "@/lib/data/moderation";
import { resolveReportAction, publishCommunityAction, publishActivityAction } from "@/lib/actions/moderation-actions";
import { getI18n } from "@/lib/i18n/server";
import { localizeText } from "@/lib/i18n/content";

const smallBtn = "min-h-10 rounded-full border border-border px-4 py-1.5 text-sm font-medium text-foreground hover:bg-surface-muted";

export default async function ModerationPage() {
  const { t, locale } = await getI18n();
  const user = await getCurrentUser();
  if (!user) return <AccessNote message={t("staff.loginAs")} link={<Link href="/login?next=/moderation" className="text-brand-strong underline underline-offset-2">{t("staff.login")}</Link>} />;

  try {
    await requireRole("MODERATOR");
  } catch (err) {
    if (err instanceof AuthorizationError) {
      return <AccessNote message={t("staff.denied.mod", { role: user.role.toLowerCase() })} />;
    }
    throw err;
  }

  const [reports, pendingCommunities, pendingActivities] = await Promise.all([listOpenReports(), listPendingCommunities(), listPendingActivities()]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6">
      <section className="flex flex-col gap-3">
        <h1 className="font-display text-2xl font-semibold text-foreground">{t("mod.pending.title")}</h1>
        <p className="text-sm text-foreground-muted">{t("mod.pending.lead")}</p>
        {pendingCommunities.length === 0 && pendingActivities.length === 0 ? (
          <p className="text-sm text-foreground-muted">{t("mod.pending.none")}</p>
        ) : (
          <div className="flex flex-col gap-3">
            {pendingCommunities.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-4">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {t("mod.community", { name: c.name })} <span className="text-foreground-muted">{t("mod.by", { name: c.organizerName })}</span>
                  </p>
                  <Link href={`/communities/${c.slug}`} className="text-xs text-brand-strong underline underline-offset-2">
                    {t("mod.preview")}
                  </Link>
                </div>
                <form action={publishCommunityAction}>
                  <input type="hidden" name="communityId" value={c.id} />
                  <button type="submit" className={smallBtn}>
                    {t("mod.publish")}
                  </button>
                </form>
              </div>
            ))}
            {pendingActivities.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-4">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {t("mod.event", { name: a.title })} <span className="text-foreground-muted">— {a.communityName}, {t("mod.by", { name: a.organizerName })}</span>
                  </p>
                  <Link href={`/discover/${a.slug}`} className="text-xs text-brand-strong underline underline-offset-2">
                    {t("mod.preview")}
                  </Link>
                </div>
                <form action={publishActivityAction}>
                  <input type="hidden" name="activityId" value={a.id} />
                  <button type="submit" className={smallBtn}>
                    {t("mod.publish")}
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-xl font-semibold text-foreground">{t("mod.reports.title")}</h2>
        {reports.length === 0 ? (
          <p className="text-sm text-foreground-muted">{t("mod.reports.none")}</p>
        ) : (
          <div className="flex flex-col gap-3">
            {reports.map((r) => (
              <div key={r.id} className="rounded-2xl border border-border bg-surface p-4">
                <p className="text-sm font-medium text-foreground">
                  {r.activityTitle ?? (r.needDescription ? t("mod.report.need", { text: localizeText(r.needDescription, locale) }) : t("mod.report.generic"))} —{" "}
                  {t("mod.report.reportedBy", { name: r.reporterName })}
                </p>
                <p className="mt-1 text-sm text-foreground-muted">{r.reason}</p>
                <form action={resolveReportAction} className="mt-3 flex flex-wrap items-center gap-2">
                  <input type="hidden" name="reportId" value={r.id} />
                  <input type="text" name="note" placeholder={t("mod.report.note")} aria-label={t("mod.report.note")} className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm" />
                  <button type="submit" className={smallBtn}>
                    {t("mod.report.resolve")}
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </section>
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

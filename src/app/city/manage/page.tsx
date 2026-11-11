import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Card, Notice, PageShell, Pill, buttonClass } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth/current-user";
import {
  archiveNoticeAction,
  createNoticeAction,
  createServiceAction,
  setServiceStatusAction,
  updateIssueStatusAction,
} from "@/lib/actions/city-actions";
import { listActiveNotices, listAllServicesForStaff } from "@/lib/data/city";
import { listIssueQueue } from "@/lib/data/issues";
import { isAuthorizedPartner } from "@/lib/auth/roles";
import { errorMessage } from "@/lib/i18n/errors";
import { getI18n } from "@/lib/i18n/server";
import { neighborhoodBySlug } from "@/lib/neighborhoods";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("manage.title") };
}

const box = "rounded-lg border border-border bg-background px-3 py-2 text-base text-foreground";

/**
 * Staff workspace. The role is checked here on the server (anyone else gets a plain 404, so the
 * page does not reveal itself) and again inside every data function it calls.
 */
export default async function ManagePage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  if (!user || (user.role !== "MODERATOR" && user.role !== "MUNICIPALITY_ANALYST")) notFound();
  const { t, locale, shortDate } = await getI18n();
  const isModerator = user.role === "MODERATOR";
  const partner = isAuthorizedPartner(user);
  const err = errorMessage(t, sp.error);
  const day = (d: Date) => shortDate(d.toISOString().slice(0, 10));

  const [queue, services, notices] = await Promise.all([
    listIssueQueue(user),
    isModerator ? listAllServicesForStaff(user) : Promise.resolve([]),
    isModerator ? listActiveNotices() : Promise.resolve([]),
  ]);

  return (
    <PageShell className="max-w-5xl">
      <header className="flex max-w-2xl flex-col gap-1">
        <Link href="/city" className="text-sm font-medium text-brand-strong hover:underline">
          ← {t("city.back")}
        </Link>
        <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground">{t("manage.title")}</h1>
        <p className="text-foreground-muted">{t("manage.lead")}</p>
      </header>
      {sp.saved && <Notice kind="ok">{t("manage.saved")}</Notice>}
      {err && <Notice kind="error">{err}</Notice>}

      <section aria-labelledby="queue-title" className="flex flex-col gap-3">
        <h2 id="queue-title" className="font-display text-2xl font-semibold text-foreground">
          {t("manage.queue")}
        </h2>
        {!partner && <p className="text-sm text-foreground-muted">{t("manage.partnerOnly")}</p>}
        {queue.length === 0 ? (
          <p className="text-foreground-muted">{t("manage.queueEmpty")}</p>
        ) : (
          <ul className="flex flex-col gap-4">
            {queue.map((r) => {
              const area = neighborhoodBySlug(r.areaSlug);
              return (
                <li key={r.id}>
                  <Card className="flex flex-col gap-3 p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Pill tone="brand">{t(`issue.category.${r.category}`)}</Pill>
                      {area && <Pill tone="neutral">{t(`area.${area.areaEn}`)}</Pill>}
                      <Pill tone="neutral">{t(`issue.status.${r.status}`)}</Pill>
                      <span className="text-xs text-foreground-muted">{day(r.createdAt)}</span>
                    </div>
                    <p className="text-foreground">{r.description}</p>
                    <p className="font-mono text-xs text-foreground-muted">ID {r.id}</p>
                    <form action={updateIssueStatusAction} className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
                      <input type="hidden" name="issueId" value={r.id} />
                      <label className="flex flex-col gap-1 text-sm">
                        <span className="font-medium text-foreground">{t("manage.setStatus")}</span>
                        <select name="status" className={box} defaultValue="UNDER_REVIEW">
                          {(isModerator ? ["UNDER_REVIEW", "DUPLICATE", "DECLINED"] : ["MUNICIPALITY_ACKNOWLEDGED", "RESOLVED"]).map((s) => (
                            <option key={s} value={s}>
                              {t(`issue.status.${s}`)}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="flex flex-col gap-1 text-sm">
                        <span className="font-medium text-foreground">{t("manage.note")}</span>
                        <input name="note" maxLength={500} className={box} />
                      </label>
                      {isModerator && (
                        <label className="flex flex-col gap-1 text-sm">
                          <span className="font-medium text-foreground">{t("manage.duplicateOf")}</span>
                          <input name="duplicateOfId" className={box} />
                        </label>
                      )}
                      <button type="submit" className={buttonClass("secondary", "sm")}>
                        {t("manage.save")}
                      </button>
                    </form>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {isModerator && (
        <>
          <section aria-labelledby="svc-title" className="flex flex-col gap-3">
            <h2 id="svc-title" className="font-display text-2xl font-semibold text-foreground">
              {t("manage.addService")}
            </h2>
            <form action={createServiceAction} className="grid gap-3 rounded-2xl border border-border bg-surface p-5 sm:grid-cols-2">
              {(
                [
                  ["name", "manage.field.name"],
                  ["nameSq", "manage.field.nameSq"],
                  ["category", "manage.field.category"],
                  ["sourceName", "manage.field.source"],
                  ["officialUrl", "manage.field.officialUrl"],
                ] as const
              ).map(([name, key]) => (
                <label key={name} className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-foreground">{t(key)}</span>
                  <input name={name} required className={box} />
                </label>
              ))}
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-foreground">{t("manage.field.reviewedAt")}</span>
                <input type="date" name="reviewedAt" required className={box} />
              </label>
              <label className="flex flex-col gap-1 text-sm sm:col-span-2">
                <span className="font-medium text-foreground">{t("manage.field.description")}</span>
                <textarea name="description" required rows={2} className={box} />
              </label>
              <label className="flex flex-col gap-1 text-sm sm:col-span-2">
                <span className="font-medium text-foreground">{t("manage.field.descriptionSq")}</span>
                <textarea name="descriptionSq" required rows={2} className={box} />
              </label>
              <label className="flex items-center gap-2 text-sm sm:col-span-2">
                <input type="checkbox" name="publish" />
                <span>{t("manage.field.publishNow")}</span>
              </label>
              <button type="submit" className={buttonClass("primary", "md", "w-fit")}>
                {t("manage.save")}
              </button>
            </form>
            {services.length > 0 && (
              <>
                <h3 className="font-display text-lg font-semibold text-foreground">{t("manage.servicesAll")}</h3>
                <ul className="flex flex-col gap-2">
                  {services.map((s) => (
                    <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-surface px-4 py-2 text-sm">
                      <span>
                        {locale === "sq" ? s.nameSq : s.name} <Pill tone="neutral">{s.status}</Pill>
                      </span>
                      <form action={setServiceStatusAction} className="flex gap-2">
                        <input type="hidden" name="serviceId" value={s.id} />
                        <button name="status" value={s.status === "PUBLISHED" ? "ARCHIVED" : "PUBLISHED"} type="submit" className={buttonClass("secondary", "sm")}>
                          {s.status === "PUBLISHED" ? t("manage.archive") : t("manage.field.publishNow")}
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>

          <section aria-labelledby="notice-title" className="flex flex-col gap-3">
            <h2 id="notice-title" className="font-display text-2xl font-semibold text-foreground">
              {t("manage.addNotice")}
            </h2>
            <form action={createNoticeAction} className="grid gap-3 rounded-2xl border border-border bg-surface p-5 sm:grid-cols-2">
              {(
                [
                  ["title", "manage.field.title"],
                  ["titleSq", "manage.field.titleSq"],
                  ["sourceName", "manage.field.source"],
                ] as const
              ).map(([name, key]) => (
                <label key={name} className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-foreground">{t(key)}</span>
                  <input name={name} required className={box} />
                </label>
              ))}
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-foreground">{t("manage.field.sourceUrl")}</span>
                <input name="sourceUrl" className={box} />
              </label>
              <label className="flex flex-col gap-1 text-sm sm:col-span-2">
                <span className="font-medium text-foreground">{t("manage.field.body")}</span>
                <textarea name="body" required rows={2} className={box} />
              </label>
              <label className="flex flex-col gap-1 text-sm sm:col-span-2">
                <span className="font-medium text-foreground">{t("manage.field.bodySq")}</span>
                <textarea name="bodySq" required rows={2} className={box} />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-foreground">{t("manage.field.expiresAt")}</span>
                <input type="date" name="expiresAt" className={box} />
              </label>
              <button type="submit" className={buttonClass("primary", "md", "w-fit self-end")}>
                {t("manage.save")}
              </button>
            </form>
            {notices.length > 0 && (
              <>
                <h3 className="font-display text-lg font-semibold text-foreground">{t("manage.noticesActive")}</h3>
                <ul className="flex flex-col gap-2">
                  {notices.map((n) => (
                    <li key={n.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-surface px-4 py-2 text-sm">
                      <span>{locale === "sq" ? n.titleSq : n.title}</span>
                      <form action={archiveNoticeAction}>
                        <input type="hidden" name="noticeId" value={n.id} />
                        <button type="submit" className={buttonClass("secondary", "sm")}>
                          {t("manage.archive")}
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        </>
      )}
    </PageShell>
  );
}

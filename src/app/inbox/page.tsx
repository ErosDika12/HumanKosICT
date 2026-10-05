import Link from "next/link";
import type { Metadata } from "next";
import { Button, EmptyState, PageShell } from "@/components/ui";
import { BellIcon, CalendarIcon } from "@/components/icons";
import { demoLoginAction } from "@/lib/auth/actions";
import { getCurrentUser } from "@/lib/auth/current-user";
import { listNotifications, listReminders } from "@/lib/data/notifications";
import { markAllNotificationsReadAction } from "@/lib/actions/notification-actions";
import { getI18n } from "@/lib/i18n/server";
import { localizeNotification } from "@/lib/i18n/reasons";
import { relativeDayLabel } from "@/lib/time-window";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("nav.inbox") };
}

export default async function InboxPage() {
  const { t, locale, shortDate } = await getI18n();
  const user = await getCurrentUser();
  if (!user) {
    return (
      <PageShell className="max-w-xl">
        <EmptyState
          title={t("inbox.title")}
          action={
            <form action={demoLoginAction}>
              <Button variant="accent" size="lg">{t("action.demoLogin")}</Button>
            </form>
          }
        >
          {t("inbox.lead")}
        </EmptyState>
      </PageShell>
    );
  }

  const [notifications, reminders] = await Promise.all([listNotifications(user.id), listReminders(user.id)]);
  const hasUnread = notifications.some((n) => !n.readAt);

  const whenLabel = (date: string) => {
    const rel = relativeDayLabel(date);
    const word = rel === "Today" ? t("fact.today") : rel === "Tomorrow" ? t("fact.tomorrow") : rel === "This weekend" ? t("fact.thisWeekend") : rel === "Next weekend" ? t("fact.nextWeekend") : null;
    return word ? `${word} (${shortDate(date)})` : shortDate(date);
  };

  return (
    <PageShell className="max-w-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-3xl font-semibold text-foreground">{t("inbox.title")}</h1>
          <p className="text-sm text-foreground-muted">{t("inbox.lead")}</p>
        </div>
        {hasUnread && (
          <form action={markAllNotificationsReadAction}>
            <button type="submit" className="min-h-10 rounded-full border border-border px-4 text-sm font-medium text-foreground hover:bg-surface-muted">
              {t("inbox.markAll")}
            </button>
          </form>
        )}
      </div>

      {reminders.length > 0 && (
        <section aria-labelledby="coming-up" className="flex flex-col gap-2">
          <h2 id="coming-up" className="font-display text-lg font-semibold text-foreground">
            {t("inbox.remindersTitle")}
          </h2>
          <ul className="flex flex-col gap-2">
            {reminders.map((r) => (
              <li key={r.slug} className="flex items-start gap-3 rounded-2xl border border-accent bg-accent-tint p-4 text-sm">
                <CalendarIcon size={20} className="mt-0.5 shrink-0 text-accent-strong" />
                <div>
                  <p className="font-medium text-foreground">
                    {t("inbox.reminderLine", { title: locale === "sq" ? r.titleSq : r.title, when: whenLabel(r.date), time: r.startTime })}
                  </p>
                  <Link href={`/discover/${r.slug}`} className="text-xs text-brand-strong underline underline-offset-2">
                    {t("action.viewActivity")}
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="updates" className="flex flex-col gap-2">
        <h2 id="updates" className="font-display text-lg font-semibold text-foreground">
          {t("inbox.updates")}
        </h2>
        {notifications.length === 0 ? (
          <EmptyState title={t("inbox.empty")} />
        ) : (
          <ul className="flex flex-col gap-2">
            {notifications.map((n) => (
              <li
                key={n.id}
                className={`rounded-2xl border p-4 text-sm ${
                  n.readAt ? "border-border bg-surface text-foreground-muted" : "border-brand bg-brand-tint text-foreground"
                }`}
              >
                <p className="flex items-start gap-2">
                  <BellIcon size={16} className="mt-0.5 shrink-0" />
                  <span>{localizeNotification(n.message, t, locale)}</span>
                </p>
                <div className="mt-1 flex items-center justify-between text-xs text-foreground-muted">
                  <span>{n.createdAt.toISOString().slice(0, 10)}</span>
                  {n.activitySlug && (
                    <Link href={`/discover/${n.activitySlug}`} className="inline-block py-1.5 underline underline-offset-2">
                      {t("action.viewActivity")}
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </PageShell>
  );
}

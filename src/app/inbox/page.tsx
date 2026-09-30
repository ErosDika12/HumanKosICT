import Link from "next/link";
import { DemoBadge } from "@/components/DemoBadge";
import { getCurrentUser } from "@/lib/auth/current-user";
import { listNotifications } from "@/lib/data/notifications";
import { markAllNotificationsReadAction } from "@/lib/actions/notification-actions";

export default async function InboxPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 py-10 sm:px-6">
        <DemoBadge className="self-start" />
        <p className="text-sm text-foreground-muted">
          <Link href="/login?next=/inbox" className="text-brand underline underline-offset-2">
            Sign in
          </Link>{" "}
          to see your notifications.
        </p>
      </div>
    );
  }

  const notifications = await listNotifications(user.id);
  const hasUnread = notifications.some((n) => !n.readAt);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-2">
          <DemoBadge className="self-start" />
          <h1 className="font-display text-3xl font-semibold text-foreground">Inbox</h1>
        </div>
        {hasUnread && (
          <form action={markAllNotificationsReadAction}>
            <button type="submit" className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground-muted hover:bg-surface-muted">
              Mark all read
            </button>
          </form>
        )}
      </div>

      {notifications.length === 0 ? (
        <p className="text-sm text-foreground-muted">
          No notifications yet — you&apos;ll see updates here for RSVP confirmations and event changes.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {notifications.map((n) => (
            <li
              key={n.id}
              className={`rounded-xl border p-4 text-sm ${
                n.readAt ? "border-border bg-surface text-foreground-muted" : "border-brand bg-brand-tint text-foreground"
              }`}
            >
              <p>{n.message}</p>
              <div className="mt-1 flex items-center justify-between text-xs text-foreground-muted">
                <span>{n.createdAt.toISOString().slice(0, 10)}</span>
                {n.activitySlug && (
                  <Link href={`/discover/${n.activitySlug}`} className="underline underline-offset-2">
                    View activity
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

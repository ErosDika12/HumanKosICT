import Link from "next/link";
import { Avatar, Pill } from "@/components/ui";
import type { ThreadSummary } from "@/lib/data/messages";
import { getI18n } from "@/lib/i18n/server";
import { localizeText } from "@/lib/i18n/content";

/** The clean list of conversations: avatar, name, last line, unread count. The open conversation is marked. */
export async function ConversationList({ threads, activeId }: { threads: ThreadSummary[]; activeId?: string }) {
  const { t, locale } = await getI18n();
  return (
    <nav aria-label={t("messages.conversations")} className="flex min-w-0 flex-col">
      <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
        {threads.map((th) => {
          const active = th.friendId === activeId;
          const last = th.lastIsSeeded ? localizeText(th.lastBody, locale) : th.lastBody;
          return (
            <li key={th.friendId}>
              <Link
                href={`/messages/${th.friendId}`}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-16 items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-muted ${active ? "bg-brand-tint" : ""}`}
              >
                <Avatar name={th.friendName} size={44} />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-display font-semibold text-foreground">{th.friendName}</span>
                    {th.unread > 0 && <Pill tone="danger">{t("messages.unread", { n: th.unread })}</Pill>}
                  </span>
                  <span className="block truncate text-sm text-foreground-muted">
                    {th.lastIsMine && `${t("messages.you")}: `}
                    {last}
                  </span>
                  {th.hasSeededExample && <span className="block text-[11px] text-foreground-muted">{t("messages.includesExamples")}</span>}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

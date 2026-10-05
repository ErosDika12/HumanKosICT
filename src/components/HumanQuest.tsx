import Link from "next/link";
import type { Progress } from "@/lib/data/progress";
import type { QuestKey } from "@/lib/progress-rules";
import { CheckIcon, ArrowIcon } from "@/components/icons";
import { getI18n } from "@/lib/i18n/server";

/**
 * "Your next steps": at most three open actions plus genuine completion
 * (done / total). Entirely optional — nothing in the app depends on it, and
 * there are no daily missions, streaks or expiring rewards.
 */
export async function HumanQuest({ progress, compact = false }: { progress: Progress; compact?: boolean }) {
  const { t } = await getI18n();
  const { quest, suggestedCommunity } = progress;

  const target: Record<QuestKey, { href: string; body: string }> = {
    plan: { href: "/discover?when=week", body: t("quest.plan.body") },
    friend: { href: "/people", body: t("quest.friend.body") },
    community: {
      href: suggestedCommunity ? `/communities/${suggestedCommunity.slug}` : "/communities",
      body: suggestedCommunity ? t("quest.community.body", { name: suggestedCommunity.name }) : t("quest.community.bodyAny"),
    },
    bridge: { href: "/bridge", body: t("quest.bridge.body") },
  };

  return (
    <section aria-labelledby="quest-title" className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="quest-title" className="font-display text-lg font-semibold text-foreground">
          {t("quest.title")}
        </h2>
        <p className="text-sm font-medium text-foreground-muted">{t("quest.progress", { n: quest.doneCount, total: quest.total })}</p>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-surface-muted"
        role="progressbar"
        aria-label={t("quest.title")}
        aria-valuemin={0}
        aria-valuemax={quest.total}
        aria-valuenow={quest.doneCount}
      >
        <div className="h-full rounded-full bg-success" style={{ width: `${(quest.doneCount / quest.total) * 100}%` }} />
      </div>
      {quest.next.length === 0 ? (
        <p className="inline-flex items-center gap-1.5 text-sm font-medium text-success">
          <CheckIcon size={16} />
          {t("quest.allDone")}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {quest.next.map((key) => (
            <li key={key}>
              <Link href={target[key].href} className="flex min-h-12 items-center justify-between gap-3 rounded-xl border border-border bg-background px-3 py-2 hover:bg-surface-muted">
                <span>
                  <span className="block text-sm font-semibold text-foreground">{t(`quest.${key}.title`)}</span>
                  {!compact && <span className="block text-xs text-foreground-muted">{target[key].body}</span>}
                </span>
                <ArrowIcon size={16} className="shrink-0 text-brand-strong" />
              </Link>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-foreground-muted">{t("quest.optional")}</p>
    </section>
  );
}

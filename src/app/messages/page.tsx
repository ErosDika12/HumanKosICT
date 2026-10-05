import type { Metadata } from "next";
import { ConversationList } from "@/components/ConversationList";
import { Button, ButtonLink, EmptyState, PageShell } from "@/components/ui";
import { ChatIcon } from "@/components/icons";
import { demoLoginAction } from "@/lib/auth/actions";
import { getCurrentUser } from "@/lib/auth/current-user";
import { listThreads } from "@/lib/data/messages";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("nav.messages") };
}

export default async function MessagesPage() {
  const { t } = await getI18n();
  const user = await getCurrentUser();
  if (!user) {
    return (
      <PageShell className="max-w-xl">
        <EmptyState
          title={t("messages.title")}
          action={
            <form action={demoLoginAction}>
              <Button variant="accent" size="lg">{t("action.demoLogin")}</Button>
            </form>
          }
        >
          {t("messages.lead")}
        </EmptyState>
      </PageShell>
    );
  }
  const threads = await listThreads(user.id);

  return (
    <PageShell className="max-w-5xl">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground">{t("messages.title")}</h1>
        <p className="text-foreground-muted">{t("messages.lead")}</p>
      </header>
      {threads.length === 0 ? (
        <EmptyState
          title={t("messages.none.title")}
          action={
            <ButtonLink href="/people" variant="primary">
              {t("nav.friends")}
            </ButtonLink>
          }
        >
          {t("messages.none.body")}
        </EmptyState>
      ) : (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <ConversationList threads={threads} />
          <div className="hidden min-h-64 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-surface-muted text-center text-foreground-muted lg:flex">
            <ChatIcon size={28} />
            <p className="text-sm">{t("messages.conversations")}</p>
          </div>
        </div>
      )}
    </PageShell>
  );
}

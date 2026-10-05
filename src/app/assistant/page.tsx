import type { Metadata } from "next";
import { AssistantChat } from "@/components/AssistantChat";
import { PageShell, Pill } from "@/components/ui";
import { isAiProviderConfigured } from "@/lib/assistant/ai-provider";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("nav.assistant") };
}

export default async function AssistantPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const { t } = await getI18n();
  const user = await getCurrentUser();
  const aiConfigured = isAiProviderConfigured();

  return (
    <PageShell className="max-w-3xl">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground">{t("assistant.title")}</h1>
        <p className="text-foreground-muted">{t("assistant.lead")}</p>
        <div className="flex flex-wrap items-center gap-2">
          <Pill tone={aiConfigured ? "brand" : "neutral"}>{aiConfigured ? t("assistant.mode.ai") : t("assistant.mode.rules")}</Pill>
          {!user && <Pill tone="accent">{t("assistant.loginHint")}</Pill>}
        </div>
      </header>
      <AssistantChat signedIn={Boolean(user)} aiConfigured={aiConfigured} initialQuestion={q?.slice(0, 300)} />
    </PageShell>
  );
}

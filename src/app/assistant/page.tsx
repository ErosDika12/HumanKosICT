import { AssistantChat } from "@/components/AssistantChat";
import { Eyebrow, PageShell, Pill } from "@/components/ui";
import { isAiProviderConfigured } from "@/lib/assistant/ai-provider";
import { getCurrentUser } from "@/lib/auth/current-user";
import { SIMULATED_NOW_LABEL } from "@/lib/simulated-clock";

export default async function AssistantPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const user = await getCurrentUser();
  const aiConfigured = isAiProviderConfigured();

  return (
    <PageShell className="max-w-3xl">
      <header className="flex flex-col gap-2">
        <Eyebrow>Assistant · Asistenti</Eyebrow>
        <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground">Ask the Human Network helper</h1>
        <p className="text-foreground-muted">
          A multi-turn helper grounded in the demo&apos;s stored activities, friends, plans and BRIDGE project. Today in
          the scenario is <strong>{SIMULATED_NOW_LABEL}</strong>.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Pill tone={aiConfigured ? "brand" : "neutral"}>
            {aiConfigured ? "AI phrasing enabled (server-side)" : "Limited demo assistant · rules-based, no AI model"}
          </Pill>
          {!user && <Pill tone="accent">Log in as demo for answers about your friends and plans</Pill>}
        </div>
      </header>
      <AssistantChat signedIn={Boolean(user)} aiConfigured={aiConfigured} initialQuestion={q?.slice(0, 300)} />
    </PageShell>
  );
}

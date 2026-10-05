import { notFound } from "next/navigation";
import { getCommunityBySlug } from "@/lib/data/communities";
import { getCurrentUser } from "@/lib/auth/current-user";
import { demoLoginAction } from "@/lib/auth/actions";
import { createActivityAction } from "@/lib/actions/organizer-activity-actions";
import { ActivityForm } from "@/components/ActivityForm";
import { buttonClass } from "@/components/ui";
import type { ActivityCategory } from "@/lib/types";
import { getI18n } from "@/lib/i18n/server";
import { errorMessage } from "@/lib/i18n/errors";

export default async function NewActivityPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string; title?: string; titleSq?: string; category?: string }>;
}) {
  const { slug } = await params;
  const { error, title, titleSq, category } = await searchParams;
  const { t } = await getI18n();
  const user = await getCurrentUser();
  const community = await getCommunityBySlug(slug, user?.id);
  if (!community) notFound();
  const errText = errorMessage(t, error);

  if (!user) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 py-10 sm:px-6">
        <form action={demoLoginAction}>
          <button type="submit" className={buttonClass("accent", "md")}>
            {t("form.loginToContinue")}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground">{t("form.newEvent.title", { name: community.name })}</h1>
        <p className="mt-1 text-sm text-foreground-muted">{t("form.newEvent.lead")}</p>
      </div>
      {(title || category) && <p className="rounded-lg border border-brand bg-brand-tint p-3 text-xs text-brand-strong">{t("form.newEvent.prefilled")}</p>}
      {errText && (
        <p role="alert" className="text-sm text-danger">
          {errText}
        </p>
      )}
      <ActivityForm
        action={createActivityAction}
        communitySlug={slug}
        defaults={title || titleSq || category ? { title, titleSq, category: category as ActivityCategory | undefined } : undefined}
      />
    </div>
  );
}

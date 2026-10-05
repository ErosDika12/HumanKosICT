import Link from "next/link";
import { notFound } from "next/navigation";
import { getCommunityBySlug } from "@/lib/data/communities";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createProjectAction } from "@/lib/actions/project-actions";
import { Field, FormCard, SubmitButton, TextArea } from "@/components/form-fields";
import { getI18n } from "@/lib/i18n/server";
import { errorMessage } from "@/lib/i18n/errors";

export default async function NewProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { slug } = await params;
  const { error } = await searchParams;
  const { t } = await getI18n();
  const user = await getCurrentUser();
  const community = await getCommunityBySlug(slug, user?.id);
  if (!community) notFound();
  const errText = errorMessage(t, error);

  if (!user || community.viewerMembership !== "organizer") {
    return (
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 py-10 sm:px-6">
        <p className="text-sm text-foreground-muted">
          {t("form.onlyOrganizer")}{" "}
          <Link href={`/communities/${slug}`} className="underline underline-offset-2">
            {t("form.backToCommunity")}
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
      <h1 className="font-display text-2xl font-semibold text-foreground">{t("form.newProject.title", { name: community.name })}</h1>
      {errText && (
        <p role="alert" className="text-sm text-danger">
          {errText}
        </p>
      )}
      <FormCard action={createProjectAction}>
        <input type="hidden" name="communitySlug" value={slug} />
        <Field label={t("form.titleEn")} name="title" required />
        <Field label={t("form.titleSq")} name="titleSq" required />
        <TextArea label={t("form.descEn")} name="description" required />
        <TextArea label={t("form.descSq")} name="descriptionSq" required />
        <Field label={t("form.volunteersNeeded")} name="volunteersNeeded" type="number" min={1} defaultValue={5} required />
        <SubmitButton>{t("form.newProject.submit")}</SubmitButton>
      </FormCard>
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { getCommunityBySlug } from "@/lib/data/communities";
import { getCurrentUser } from "@/lib/auth/current-user";
import { updateCommunityAction } from "@/lib/actions/community-actions";
import { Field, FormCard, SubmitButton, TextArea } from "@/components/form-fields";
import { getI18n } from "@/lib/i18n/server";

export default async function EditCommunityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { t } = await getI18n();
  const user = await getCurrentUser();
  const community = await getCommunityBySlug(slug, user?.id);
  if (!community) notFound();

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
      <h1 className="font-display text-2xl font-semibold text-foreground">{t("form.editCommunity.title", { name: community.name })}</h1>
      <FormCard action={updateCommunityAction}>
        <input type="hidden" name="slug" value={slug} />
        <TextArea label={t("form.descEn")} name="description" defaultValue={community.description} />
        <TextArea label={t("form.descSq")} name="descriptionSq" defaultValue={community.descriptionSq} />
        <Field label={t("form.language")} name="language" defaultValue={community.language ?? ""} />
        <TextArea label={t("form.rules")} name="rules" defaultValue={community.rules ?? ""} rows={2} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="visibility" value="restricted" defaultChecked={community.visibility === "restricted"} />
          <span>{t("form.restricted")}</span>
        </label>
        <SubmitButton>{t("form.saveChanges")}</SubmitButton>
      </FormCard>
    </div>
  );
}

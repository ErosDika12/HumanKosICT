import { getCurrentUser } from "@/lib/auth/current-user";
import { demoLoginAction } from "@/lib/auth/actions";
import { createCommunityAction } from "@/lib/actions/community-actions";
import { Field, FormCard, SelectField, SubmitButton, TextArea } from "@/components/form-fields";
import { buttonClass } from "@/components/ui";
import { getI18n } from "@/lib/i18n/server";
import { errorMessage } from "@/lib/i18n/errors";

const CATEGORIES = ["technology", "environment", "sports", "education", "culture", "community"] as const;

export default async function NewCommunityPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { t } = await getI18n();
  const user = await getCurrentUser();
  const { error } = await searchParams;
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
        <h1 className="font-display text-2xl font-semibold text-foreground">{t("form.newCommunity.title")}</h1>
        <p className="mt-1 text-sm text-foreground-muted">{t("form.newCommunity.lead")}</p>
      </div>
      {errText && (
        <p role="alert" className="text-sm text-danger">
          {errText}
        </p>
      )}
      <FormCard action={createCommunityAction}>
        <Field label={t("form.nameEn")} name="name" required />
        <Field label={t("form.nameSq")} name="nameSq" />
        <SelectField label={t("form.category")} name="category" defaultValue="community">
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {t(`category.${c}`)}
            </option>
          ))}
        </SelectField>
        <TextArea label={t("form.descEn")} name="description" required />
        <TextArea label={t("form.descSq")} name="descriptionSq" required />
        <Field label={t("form.areaHint")} name="areaSq" required />
        <Field label={t("form.language")} name="language" placeholder={t("form.languageHint")} />
        <TextArea label={t("form.rulesOptional")} name="rules" />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="visibility" value="restricted" />
          <span>{t("form.restricted")}</span>
        </label>
        <SubmitButton>{t("form.newCommunity.submit")}</SubmitButton>
      </FormCard>
    </div>
  );
}

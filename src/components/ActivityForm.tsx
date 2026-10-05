import { INTERESTS, interestLabel } from "@/lib/types";
import type { DemoActivity } from "@/lib/types";
import { Field, FormCard, SelectField, SubmitButton, TextArea } from "@/components/form-fields";
import { getI18n } from "@/lib/i18n/server";

const CATEGORIES = ["technology", "environment", "sports", "education", "culture", "community"] as const;
const ACCESSIBILITY_TAGS = ["wheelchair-accessible", "quiet-space-available", "captioned"];
const AGE_OPTIONS: DemoActivity["ageEligibility"][] = ["all-ages", "adults-only", "supervised-minors"];
const DIFFICULTY_OPTIONS: DemoActivity["difficulty"][] = ["beginner", "intermediate", "advanced", "all-levels"];

export interface ActivityFormValues {
  title: string;
  titleSq: string;
  summary: string;
  summarySq: string;
  category: DemoActivity["category"];
  areaSq: string;
  areaEn: string;
  venueName: string;
  lat: number;
  lng: number;
  date: string;
  startTime: string;
  capacity: number;
  cost: DemoActivity["cost"];
  costDetail?: string;
  indoor: boolean;
  accessibility: string[];
  ageEligibility: DemoActivity["ageEligibility"];
  difficulty: DemoActivity["difficulty"];
  description: string;
  descriptionSq: string;
  interestTags: string[];
}

/**
 * Shared create/edit form for organizer-authored activities. A plain
 * server-rendered <form> posting to a bound server action. It collects both
 * English and Albanian text so the activity can be shown in either language.
 */
export async function ActivityForm({
  action,
  communitySlug,
  activitySlug,
  defaults,
}: {
  action: (formData: FormData) => Promise<void>;
  communitySlug?: string;
  activitySlug?: string;
  defaults?: Partial<ActivityFormValues>;
}) {
  const { t, locale } = await getI18n();
  return (
    <FormCard action={action}>
      {communitySlug && <input type="hidden" name="communitySlug" value={communitySlug} />}
      {activitySlug && <input type="hidden" name="slug" value={activitySlug} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("form.titleEn")} name="title" defaultValue={defaults?.title} required />
        <Field label={t("form.titleSq")} name="titleSq" defaultValue={defaults?.titleSq} required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("form.summaryEn")} name="summary" defaultValue={defaults?.summary} required />
        <Field label={t("form.summarySq")} name="summarySq" defaultValue={defaults?.summarySq} required />
      </div>

      <SelectField label={t("form.category")} name="category" defaultValue={defaults?.category ?? "community"}>
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {t(`category.${c}`)}
          </option>
        ))}
      </SelectField>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("form.areaEn")} name="areaEn" defaultValue={defaults?.areaEn} placeholder="Prishtina — Dardania" required />
        <Field label={t("form.areaSq")} name="areaSq" defaultValue={defaults?.areaSq} placeholder="Prishtinë — Dardania" required />
      </div>
      <Field label={t("form.venue")} name="venueName" defaultValue={defaults?.venueName} required />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("form.lat")} name="lat" type="number" step="any" defaultValue={defaults?.lat} placeholder="42.6653" required />
        <Field label={t("form.lng")} name="lng" type="number" step="any" defaultValue={defaults?.lng} placeholder="21.1622" required />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("form.date")} name="date" defaultValue={defaults?.date} placeholder="2036-06-22" required />
        <Field label={t("form.time")} name="startTime" defaultValue={defaults?.startTime} placeholder="18:00" required />
      </div>
      <Field label={t("form.capacity")} name="capacity" type="number" min={1} defaultValue={defaults?.capacity} required />

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-foreground">{t("form.cost")}</legend>
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" name="cost" value="free" defaultChecked={!defaults || defaults.cost === "free"} />
          {t("fact.free")}
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" name="cost" value="paid" defaultChecked={defaults?.cost === "paid"} />
          {t("fact.paid")}
        </label>
        <Field label={t("form.costDetail")} name="costDetail" defaultValue={defaults?.costDetail} placeholder={t("form.costPlaceholder")} />
      </fieldset>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="indoor" defaultChecked={defaults?.indoor ?? true} />
        {t("form.indoor")}
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-foreground">{t("form.accessibility")}</legend>
        {ACCESSIBILITY_TAGS.map((tag) => (
          <label key={tag} className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="accessibility" value={tag} defaultChecked={defaults?.accessibility?.includes(tag)} />
            {t(`access.${tag}`)}
          </label>
        ))}
      </fieldset>

      <SelectField label={t("form.age")} name="ageEligibility" defaultValue={defaults?.ageEligibility ?? "all-ages"}>
        {AGE_OPTIONS.map((a) => (
          <option key={a} value={a}>
            {a === "supervised-minors" ? t("form.ageMinors") : t(`age.${a}`)}
          </option>
        ))}
      </SelectField>

      <SelectField label={t("form.difficulty")} name="difficulty" defaultValue={defaults?.difficulty ?? "all-levels"}>
        {DIFFICULTY_OPTIONS.map((d) => (
          <option key={d} value={d}>
            {t(`difficulty.${d}`)}
          </option>
        ))}
      </SelectField>

      <TextArea label={t("form.descEn")} name="description" defaultValue={defaults?.description} required />
      <TextArea label={t("form.descSq")} name="descriptionSq" defaultValue={defaults?.descriptionSq} required />

      <fieldset className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <legend className="col-span-full text-sm font-medium text-foreground">{t("form.interests")}</legend>
        {INTERESTS.map((i) => (
          <label key={i.id} className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="interestTags" value={i.id} defaultChecked={defaults?.interestTags?.includes(i.id)} />
            {i.emoji} {interestLabel(i, locale)}
          </label>
        ))}
      </fieldset>

      <SubmitButton>{activitySlug ? t("form.saveChanges") : t("form.createEvent")}</SubmitButton>
    </FormCard>
  );
}

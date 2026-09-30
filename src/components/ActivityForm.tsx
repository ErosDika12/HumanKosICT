import { INTERESTS } from "@/lib/types";
import type { DemoActivity } from "@/lib/types";

const CATEGORIES = [
  { id: "technology", label: "Technology" },
  { id: "environment", label: "Environment" },
  { id: "sports", label: "Sports" },
  { id: "education", label: "Education" },
  { id: "culture", label: "Culture" },
  { id: "community", label: "Community" },
];

const ACCESSIBILITY_TAGS = ["wheelchair-accessible", "quiet-space-available", "captioned"];

const AGE_OPTIONS: { id: DemoActivity["ageEligibility"]; label: string }[] = [
  { id: "all-ages", label: "All ages" },
  { id: "adults-only", label: "Adults only" },
  { id: "supervised-minors", label: "Supervised minors (school/guardian-supervised only)" },
];

const DIFFICULTY_OPTIONS: { id: DemoActivity["difficulty"]; label: string }[] = [
  { id: "beginner", label: "Beginner" },
  { id: "intermediate", label: "Intermediate" },
  { id: "advanced", label: "Advanced" },
  { id: "all-levels", label: "All levels" },
];

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
 * server-rendered <form> — no client JS required — posting directly to a
 * bound server action (createActivityAction or updateActivityAction).
 */
export function ActivityForm({
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
  return (
    <form action={action} className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5">
      {communitySlug && <input type="hidden" name="communitySlug" value={communitySlug} />}
      {activitySlug && <input type="hidden" name="slug" value={activitySlug} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Title (English)" name="title" defaultValue={defaults?.title} required />
        <Field label="Title (Albanian)" name="titleSq" defaultValue={defaults?.titleSq} required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Summary (English)" name="summary" defaultValue={defaults?.summary} required />
        <Field label="Summary (Albanian)" name="summarySq" defaultValue={defaults?.summarySq} required />
      </div>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-foreground">Category</span>
        <select name="category" defaultValue={defaults?.category ?? "community"} className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground">
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Area (English)" name="areaEn" defaultValue={defaults?.areaEn} placeholder="Prishtina — Dardania" required />
        <Field label="Area (Albanian)" name="areaSq" defaultValue={defaults?.areaSq} placeholder="Prishtinë — Dardania" required />
      </div>
      <Field label="Venue name" name="venueName" defaultValue={defaults?.venueName} required />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Latitude" name="lat" type="number" step="any" defaultValue={defaults?.lat?.toString()} placeholder="42.6653" required />
        <Field label="Longitude" name="lng" type="number" step="any" defaultValue={defaults?.lng?.toString()} placeholder="21.1622" required />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Date (YYYY-MM-DD)" name="date" defaultValue={defaults?.date} placeholder="2036-06-22" required />
        <Field label="Start time (HH:MM)" name="startTime" defaultValue={defaults?.startTime} placeholder="18:00" required />
      </div>
      <Field label="Capacity" name="capacity" type="number" min={1} defaultValue={defaults?.capacity?.toString()} required />

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-foreground">Cost</legend>
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" name="cost" value="free" defaultChecked={!defaults || defaults.cost === "free"} />
          Free
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" name="cost" value="paid" defaultChecked={defaults?.cost === "paid"} />
          Paid
        </label>
        <Field label="Cost detail (required if paid)" name="costDetail" defaultValue={defaults?.costDetail} placeholder="€2 suggested donation" />
      </fieldset>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="indoor" defaultChecked={defaults?.indoor ?? true} />
        Indoor
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-foreground">Accessibility</legend>
        {ACCESSIBILITY_TAGS.map((tag) => (
          <label key={tag} className="flex items-center gap-2 text-sm capitalize">
            <input type="checkbox" name="accessibility" value={tag} defaultChecked={defaults?.accessibility?.includes(tag)} />
            {tag.replace(/-/g, " ")}
          </label>
        ))}
      </fieldset>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-foreground">Age eligibility</span>
        <select name="ageEligibility" defaultValue={defaults?.ageEligibility ?? "all-ages"} className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground">
          {AGE_OPTIONS.map((a) => (
            <option key={a.id} value={a.id}>
              {a.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-foreground">Difficulty</span>
        <select name="difficulty" defaultValue={defaults?.difficulty ?? "all-levels"} className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground">
          {DIFFICULTY_OPTIONS.map((d) => (
            <option key={d.id} value={d.id}>
              {d.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-foreground">Description (English)</span>
        <textarea name="description" defaultValue={defaults?.description} rows={3} required className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-foreground">Description (Albanian)</span>
        <textarea name="descriptionSq" defaultValue={defaults?.descriptionSq} rows={3} required className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" />
      </label>

      <fieldset className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <legend className="col-span-full text-sm font-medium text-foreground">Related interests</legend>
        {INTERESTS.map((i) => (
          <label key={i.id} className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="interestTags" value={i.id} defaultChecked={defaults?.interestTags?.includes(i.id)} />
            {i.emoji} {i.labelEn}
          </label>
        ))}
      </fieldset>

      <button type="submit" className="inline-flex w-fit items-center justify-center rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-strong">
        {activitySlug ? "Save changes" : "Create event"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  required,
  placeholder,
  type = "text",
  step,
  min,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
  placeholder?: string;
  type?: string;
  step?: string;
  min?: number;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-foreground">{label}</span>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue}
        required={required}
        placeholder={placeholder}
        step={step}
        min={min}
        className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
      />
    </label>
  );
}

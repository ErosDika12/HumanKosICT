import Link from "next/link";
import { DemoBadge } from "@/components/DemoBadge";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createCommunityAction } from "@/lib/actions/community-actions";

const CATEGORIES = [
  { id: "technology", label: "Technology" },
  { id: "environment", label: "Environment" },
  { id: "sports", label: "Sports" },
  { id: "education", label: "Education" },
  { id: "culture", label: "Culture" },
  { id: "community", label: "Community" },
];

export default async function NewCommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();
  const { error } = await searchParams;

  if (!user) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 py-10 sm:px-6">
        <DemoBadge className="self-start" />
        <p className="text-sm text-foreground-muted">
          <Link href="/login?next=/communities/new" className="text-brand underline underline-offset-2">
            Sign in
          </Link>{" "}
          to start a community.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
      <DemoBadge className="self-start" />
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground">Start a community</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Your community starts hidden (pending review) until a moderator publishes it — see{" "}
          <Link href="/moderation" className="underline underline-offset-2">
            /moderation
          </Link>{" "}
          if you&apos;re signed in as the moderator persona.
        </p>
      </div>

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      <form action={createCommunityAction} className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5">
        <Field label="Name (English)" name="name" required />
        <Field label="Name (Albanian)" name="nameSq" />
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-foreground">Category</span>
          <select name="category" defaultValue="community" className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground">
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <TextArea label="Description (English)" name="description" required />
        <TextArea label="Description (Albanian)" name="descriptionSq" required />
        <Field label="Area (e.g. Prishtinë — Dardania)" name="areaSq" required />
        <Field label="Language(s)" name="language" placeholder="e.g. Albanian, English" />
        <TextArea label="Rules (optional)" name="rules" />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="visibility" value="restricted" />
          <span>Restricted — new members need my approval before joining</span>
        </label>
        <button type="submit" className="inline-flex w-fit items-center justify-center rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-strong">
          Create community
        </button>
      </form>
    </div>
  );
}

function Field({ label, name, required, placeholder }: { label: string; name: string; required?: boolean; placeholder?: string }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-foreground">{label}</span>
      <input
        type="text"
        name={name}
        required={required}
        placeholder={placeholder}
        className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
      />
    </label>
  );
}

function TextArea({ label, name, required }: { label: string; name: string; required?: boolean }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-foreground">{label}</span>
      <textarea
        name={name}
        required={required}
        rows={3}
        className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
      />
    </label>
  );
}

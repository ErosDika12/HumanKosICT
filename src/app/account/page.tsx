import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getOwnProfile } from "@/lib/data/profile";
import { updateProfileAction } from "@/lib/actions/profile-actions";

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 py-10 sm:px-6">
        <p className="text-sm text-foreground-muted">
          <Link href="/login?next=/account" className="text-brand underline underline-offset-2">
            Sign in
          </Link>{" "}
          to view your account.
        </p>
      </div>
    );
  }

  const profile = await getOwnProfile(user.id);
  if (!profile) return null;

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground">Your account</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          {profile.name} · {profile.email} · role: {profile.role.toLowerCase()}
        </p>
      </div>

      <form action={updateProfileAction} className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-foreground">Bio (English)</span>
          <textarea
            name="bio"
            defaultValue={profile.bio ?? ""}
            rows={3}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-foreground">Bio (Albanian)</span>
          <textarea
            name="bioSq"
            defaultValue={profile.bioSq ?? ""}
            rows={3}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isDiscoverable" defaultChecked={profile.isDiscoverable} />
          <span>
            Make my name and bio discoverable to other members (off by default — see
            docs/PRODUCT_CONTRACT.md).
          </span>
        </label>
        <button
          type="submit"
          className="inline-flex w-fit items-center justify-center rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-strong"
        >
          Save
        </button>
      </form>

      <p className="text-xs text-foreground-muted">
        This form only ever edits the signed-in account — there is no user-id field a request
        could tamper with to edit someone else&apos;s profile.
      </p>
    </div>
  );
}

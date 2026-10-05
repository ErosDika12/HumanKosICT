import { getCurrentUser } from "@/lib/auth/current-user";
import { demoLoginAction } from "@/lib/auth/actions";
import { getOwnProfile } from "@/lib/data/profile";
import { updateProfileAction } from "@/lib/actions/profile-actions";
import { buttonClass } from "@/components/ui";
import { getI18n } from "@/lib/i18n/server";

export default async function AccountPage() {
  const { t } = await getI18n();
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 py-10 sm:px-6">
        <form action={demoLoginAction}>
          <button type="submit" className={buttonClass("accent", "md")}>
            {t("account.login")}
          </button>
        </form>
      </div>
    );
  }

  const profile = await getOwnProfile(user.id);
  if (!profile) return null;
  const box = "rounded-lg border border-border bg-background px-3 py-2 text-base text-foreground";

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground">{t("account.title")}</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          {t("account.meta", { name: profile.name, email: profile.email, role: profile.role.toLowerCase() })}
        </p>
      </div>

      <form action={updateProfileAction} className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-foreground">{t("account.bio")}</span>
          <textarea name="bio" defaultValue={profile.bio ?? ""} rows={3} className={box} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-foreground">{t("account.bioSq")}</span>
          <textarea name="bioSq" defaultValue={profile.bioSq ?? ""} rows={3} className={box} />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isDiscoverable" defaultChecked={profile.isDiscoverable} />
          <span>{t("account.discoverable")}</span>
        </label>
        <button type="submit" className="inline-flex min-h-10 w-fit items-center justify-center rounded-full bg-brand px-6 py-2 text-sm font-semibold text-white hover:bg-brand-strong">
          {t("account.save")}
        </button>
      </form>
    </div>
  );
}

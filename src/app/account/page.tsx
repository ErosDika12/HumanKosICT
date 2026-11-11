import { getCurrentUser } from "@/lib/auth/current-user";
import { deleteAccountAction, demoLoginAction } from "@/lib/auth/actions";
import { errorMessage } from "@/lib/i18n/errors";
import { Notice } from "@/components/ui";
import { getOwnProfile } from "@/lib/data/profile";
import { updateProfileAction } from "@/lib/actions/profile-actions";
import { buttonClass } from "@/components/ui";
import { getI18n } from "@/lib/i18n/server";

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
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
  const errMsg = errorMessage(t, error);
  const canDelete = (profile.role === "MEMBER" || profile.role === "ORGANIZER") && !user.isDemoPersona;
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

      {errMsg && <Notice kind="error">{errMsg}</Notice>}

      <section aria-labelledby="delete-title" className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5">
        <h2 id="delete-title" className="font-display text-lg font-semibold text-foreground">
          {t("account.delete.title")}
        </h2>
        {canDelete ? (
          <form action={deleteAccountAction} className="flex flex-col gap-3">
            <p className="text-sm text-foreground-muted">{t("account.delete.body")}</p>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-foreground">{t("account.delete.confirm")}</span>
              <input name="confirm" required autoComplete="off" className={box} />
            </label>
            <button type="submit" className={buttonClass("danger", "md", "w-fit")}>
              {t("account.delete.submit")}
            </button>
          </form>
        ) : (
          <p className="text-sm text-foreground-muted">{t("account.delete.staff")}</p>
        )}
      </section>
    </div>
  );
}

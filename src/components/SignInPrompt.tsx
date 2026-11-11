import { ButtonLink, buttonClass } from "@/components/ui";
import { demoLoginAction } from "@/lib/auth/actions";
import { getI18n } from "@/lib/i18n/server";

/** Browsing is public; this appears only where someone must sign in to act (join, save, message, report). */
export async function SignInPrompt({ message }: { message: string }) {
  const { t } = await getI18n();
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface-muted p-5">
      <p className="text-foreground">{message}</p>
      <div className="flex flex-wrap items-center gap-3">
        <form action={demoLoginAction}>
          <button type="submit" className={buttonClass("accent", "md")}>
            {t("action.demoLogin")}
          </button>
        </form>
        <ButtonLink href="/login" variant="secondary">
          {t("nav.staffSignIn")}
        </ButtonLink>
      </div>
    </div>
  );
}

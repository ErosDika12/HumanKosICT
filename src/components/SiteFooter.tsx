import Link from "next/link";
import { getI18n } from "@/lib/i18n/server";
import { SIMULATED_NOW_ISO } from "@/lib/simulated-clock";

export async function SiteFooter() {
  const { t, longDate } = await getI18n();
  return (
    <footer className="mt-auto border-t border-border bg-surface pb-16 lg:pb-0">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="max-w-xl text-sm text-foreground-muted">{t("footer.disclosure", { date: longDate(SIMULATED_NOW_ISO) })}</p>
        <nav aria-label={t("footer.nav")} className="flex flex-wrap gap-x-5 gap-y-0 text-sm text-foreground-muted">
          <Link href="/needs" className="inline-block py-2 underline underline-offset-2">{t("nav.needs")}</Link>
          <Link href="/credits" className="inline-block py-2 underline underline-offset-2">{t("nav.credits")}</Link>
          <Link href="/login" className="inline-block py-2 underline underline-offset-2">{t("nav.staffSignIn")}</Link>
        </nav>
      </div>
    </footer>
  );
}

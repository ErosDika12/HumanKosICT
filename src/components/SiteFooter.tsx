import Link from "next/link";
import { getI18n } from "@/lib/i18n/server";
import { SIMULATED_NOW_ISO } from "@/lib/simulated-clock";

export async function SiteFooter() {
  const { t, longDate } = await getI18n();
  return (
    <footer className="mt-auto border-t border-border bg-surface pb-16 lg:pb-0">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div className="flex max-w-xl flex-col gap-2">
          <p className="inline-flex w-fit items-center gap-1.5 rounded-full border border-accent/40 bg-accent-tint px-3 py-1 text-xs font-medium text-accent-strong">
            <span aria-hidden="true">●</span>
            {t("shell.demoBadge")}
          </p>
          <p className="text-xs leading-relaxed text-foreground-muted">{t("footer.disclaimer")}</p>
          <p className="text-xs text-foreground-muted">{t("footer.clock", { date: longDate(SIMULATED_NOW_ISO) })}</p>
        </div>
        <nav aria-label={t("footer.nav")} className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-foreground-muted">
          <Link href="/needs" className="underline underline-offset-2">{t("nav.needs")}</Link>
          <Link href="/credits" className="underline underline-offset-2">{t("nav.credits")}</Link>
        </nav>
      </div>
    </footer>
  );
}

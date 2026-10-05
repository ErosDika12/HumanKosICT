import type { Metadata } from "next";
import { Photo } from "@/components/Photo";
import { Card, PageShell } from "@/components/ui";
import { listPhotos } from "@/lib/photos";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("credits.title") };
}

export default async function CreditsPage() {
  const { t } = await getI18n();
  const photos = listPhotos();
  return (
    <PageShell>
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground">{t("credits.title")}</h1>
        <p className="max-w-3xl text-foreground-muted">{t("credits.lead")}</p>
      </header>
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {photos.map((p) => (
          <li key={p.key}>
            <Card className="flex h-full flex-col overflow-hidden">
              <Photo photo={p} small className="relative aspect-[16/10] w-full bg-surface-muted" />
              <div className="flex flex-1 flex-col gap-1 p-4 text-sm">
                <p className="font-semibold text-foreground">{p.place}</p>
                <p className="text-foreground-muted">
                  {p.author} ·{" "}
                  {p.licenseUrl ? (
                    <a href={p.licenseUrl} className="inline-block py-1 underline" rel="noopener noreferrer">
                      {p.license}
                    </a>
                  ) : (
                    p.license
                  )}
                </p>
                <a href={p.source} className="mt-auto inline-block py-1.5 text-sm text-brand-strong underline" rel="noopener noreferrer">
                  {t("credits.source")}
                </a>
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </PageShell>
  );
}

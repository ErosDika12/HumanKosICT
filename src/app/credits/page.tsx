import type { Metadata } from "next";
import { Photo } from "@/components/Photo";
import { Card, Eyebrow, PageShell } from "@/components/ui";
import { listPhotos, PHOTO_DISCLAIMER } from "@/lib/photos";

export const metadata: Metadata = { title: "Photo credits — Human Network" };

export default function CreditsPage() {
  const photos = listPhotos();
  return (
    <PageShell>
      <header className="flex flex-col gap-2">
        <Eyebrow>Credits</Eyebrow>
        <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground">Photo credits</h1>
        <p className="max-w-3xl text-foreground-muted">
          All photographs come from Wikimedia Commons under open licenses (CC0, CC BY, CC BY-SA or public domain) and were
          resized for mobile. {PHOTO_DISCLAIMER} Places shown may be real; the activities, people and communities in this
          demo are fictional.
        </p>
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
                    <a href={p.licenseUrl} className="underline" rel="noopener noreferrer">
                      {p.license}
                    </a>
                  ) : (
                    p.license
                  )}
                </p>
                <a href={p.source} className="mt-auto text-xs text-brand-strong underline" rel="noopener noreferrer">
                  Source: Wikimedia Commons
                </a>
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </PageShell>
  );
}

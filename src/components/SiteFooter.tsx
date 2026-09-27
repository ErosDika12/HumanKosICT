import { DemoBadge } from "./DemoBadge";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-surface">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex flex-col gap-2">
          <DemoBadge />
          <p className="max-w-lg text-xs text-foreground-muted">
            Të gjitha aktivitetet, komunitetet, organizatat dhe të dhënat e qytetit në këtë
            prototip janë fiktive dhe shërbejnë vetëm për demonstrim. Asnjë e dhënë nuk përfaqëson
            gjetje reale komunale apo persona realë.
          </p>
        </div>
        <p className="text-xs text-foreground-muted">
          KOSOVO 2036 — HUMAN NETWORK · Interactive prototype, Phase 1
        </p>
      </div>
    </footer>
  );
}

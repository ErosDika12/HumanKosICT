import Link from "next/link";
import { DemoBadge } from "./DemoBadge";
import { SIMULATED_NOW_LABEL } from "@/lib/simulated-clock";

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
          <p className="max-w-lg text-xs text-foreground-muted" title="A fixed in-universe date, not the real current date — see docs/ARCHITECTURE.md.">
            Simulated &quot;today&quot; inside this 2036 scenario: <strong>{SIMULATED_NOW_LABEL}</strong> — not
            the real current date.
          </p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-foreground-muted">
          <Link href="/needs" className="underline underline-offset-2">Community needs</Link>
          <Link href="/impact" className="underline underline-offset-2">My impact</Link>
          <Link href="/municipality" className="underline underline-offset-2">Municipality view</Link>
          <Link href="/credits" className="underline underline-offset-2">Photo credits</Link>
        </nav>
      </div>
    </footer>
  );
}

import type { Translate } from "./translate";

const SQ_TO_EN: Record<string, string> = {
  Qendër: "Prishtina — Center",
  Dardania: "Prishtina — Dardania",
  Gërmia: "Prishtina — Germia",
  Lakrishtë: "Prishtina — Lakrishtë",
  "Sunny Hill": "Prishtina — Sunny Hill",
  Ulpiana: "Prishtina — Ulpiana",
};

/** "Prishtinë — Qendër" (stored Albanian area) → the neighbourhood name in the visitor's language. */
export function areaFromSq(areaSq: string | null | undefined, t: Translate): string {
  if (!areaSq) return "";
  const tail = areaSq.replace(/^Prishtinë\s+—\s+/, "");
  const key = SQ_TO_EN[tail];
  return key ? t(`area.${key}`) : tail;
}

/** Same for the English stored form "Prishtina — Dardania". */
export function areaFromEn(areaEn: string, t: Translate): string {
  return t(`area.${areaEn}`);
}

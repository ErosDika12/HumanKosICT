"use server";

import { requireUser } from "@/lib/auth/current-user";
import { saveUserInterests } from "@/lib/data/interests";
import type { InterestId } from "@/lib/types";
import { INTERESTS } from "@/lib/types";

const VALID_IDS = new Set(INTERESTS.map((i) => i.id));

export async function saveInterestsAction(interestIds: string[]): Promise<void> {
  const user = await requireUser();
  const cleaned = interestIds.filter((id): id is InterestId => VALID_IDS.has(id as InterestId));
  await saveUserInterests(user.id, cleaned);
}

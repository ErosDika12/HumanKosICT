import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Server-side usage limits for the assistant, per account and per real UTC
 * day (stored in AssistantUsage). One counter covers every message; the AI
 * provider is only used while the count is under the (smaller) AI limit, so a
 * visitor can keep chatting with the rules-based helper after the AI budget
 * is spent, up to the hard daily limit.
 */
export function assistantLimits(): { hardLimit: number; aiLimit: number } {
  const hard = Number(process.env.ASSISTANT_DAILY_LIMIT);
  const ai = Number(process.env.ASSISTANT_AI_DAILY_LIMIT);
  return {
    hardLimit: Number.isFinite(hard) && hard > 0 ? hard : 60,
    aiLimit: Number.isFinite(ai) && ai > 0 ? ai : 20,
  };
}

export interface QuotaResult {
  allowed: boolean;
  aiAllowed: boolean;
  used: number;
  hardLimit: number;
}

export async function consumeAssistantQuota(userId: string): Promise<QuotaResult> {
  const { hardLimit, aiLimit } = assistantLimits();
  const day = new Date().toISOString().slice(0, 10);
  const row = await prisma.assistantUsage.upsert({
    where: { userId_day: { userId, day } },
    create: { userId, day, count: 1 },
    update: { count: { increment: 1 } },
  });
  return { allowed: row.count <= hardLimit, aiAllowed: row.count <= aiLimit, used: row.count, hardLimit };
}

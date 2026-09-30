import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { respondToChat, type ChatMessage, type ChatState } from "@/lib/assistant/conversation";
import { consumeAssistantQuota } from "@/lib/assistant/usage";
import { getAiProviderConfig } from "@/lib/assistant/ai-provider";

export const dynamic = "force-dynamic";

const MAX_MESSAGES = 12;
const MAX_CONTENT = 500;

function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true; // non-browser clients carry no Origin; they hold no cookie session either
  try {
    return new URL(origin).host === req.headers.get("host");
  } catch {
    return false;
  }
}

function parseBody(raw: unknown): { messages: ChatMessage[]; state: ChatState } | null {
  if (typeof raw !== "object" || raw === null) return null;
  const body = raw as { messages?: unknown; state?: unknown };
  if (!Array.isArray(body.messages) || body.messages.length === 0 || body.messages.length > MAX_MESSAGES) return null;
  const messages: ChatMessage[] = [];
  for (const m of body.messages) {
    if (typeof m !== "object" || m === null) return null;
    const { role, content } = m as { role?: unknown; content?: unknown };
    if ((role !== "user" && role !== "assistant") || typeof content !== "string") return null;
    messages.push({ role, content: content.slice(0, MAX_CONTENT) });
  }
  if (messages[messages.length - 1].role !== "user" || !messages[messages.length - 1].content.trim()) return null;
  const st = (body.state ?? {}) as { focusFriendId?: unknown; shownSlugs?: unknown };
  const state: ChatState = {
    focusFriendId: typeof st.focusFriendId === "string" ? st.focusFriendId.slice(0, 64) : undefined,
    shownSlugs: Array.isArray(st.shownSlugs)
      ? st.shownSlugs.filter((s): s is string => typeof s === "string").map((s) => s.slice(0, 120)).slice(-40)
      : [],
  };
  return { messages, state };
}

export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Cross-site requests are not allowed." }, { status: 403 });

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const parsed = parseBody(raw);
  if (!parsed) return NextResponse.json({ error: "Send up to 12 messages, the last one from the user (max 500 characters each)." }, { status: 400 });

  const user = await getCurrentUser();
  let aiAllowed = false;
  if (user) {
    const quota = await consumeAssistantQuota(user.id);
    if (!quota.allowed) {
      return NextResponse.json(
        { error: `Daily assistant limit reached (${quota.hardLimit} messages). It resets tomorrow — you can still browse everything else.` },
        { status: 429 }
      );
    }
    aiAllowed = quota.aiAllowed;
  }

  try {
    const reply = await respondToChat({ messages: parsed.messages, state: parsed.state, viewerId: user?.id, aiAllowed });
    return NextResponse.json({ reply, mode: getAiProviderConfig() ? "ai-available" : "rules-only" });
  } catch (err) {
    console.error("assistant error", err);
    return NextResponse.json({ error: "The assistant hit a problem. Please try again." }, { status: 500 });
  }
}

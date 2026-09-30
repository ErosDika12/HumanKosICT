import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { detectFriendMention, detectWeekendScope, parseTurn, weekendRange } from "@/lib/assistant/conversation-parser";
import { decideSimulatedReply, parseAvailability, serializeAvailability, slotOfActivity } from "@/lib/demo-social";
import { computeBridgeNextStep, computeBridgeStages } from "@/lib/data/bridge-stages";
import { respondToChat } from "@/lib/assistant/conversation";
import {
  AiProviderError,
  generateGroundedText,
  isAiProviderConfigured,
  sanitizeModelText,
} from "@/lib/assistant/ai-provider";
import { createDemoVisitor } from "@/lib/data/demo-session";

const FRIENDS = [
  { id: "user-arta", name: "Arta Krasniqi" },
  { id: "friend-era", name: "Era Shala" },
  { id: "friend-lulzim", name: "Lulzim Bytyqi" },
];

describe("assistant conversation parser", () => {
  it("recognises a friend by first or full name, and never guesses when ambiguous", () => {
    assert.equal(detectFriendMention("Which activity could I attend with Arta?", FRIENDS), "user-arta");
    assert.equal(detectFriendMention("anything with lulzim bytyqi", FRIENDS), "friend-lulzim");
    assert.equal(detectFriendMention("what about the weekend", FRIENDS), null);
    assert.equal(detectFriendMention("with Ar", FRIENDS), null);
  });

  it("classifies the three headline questions", () => {
    assert.equal(parseTurn("What can I do this weekend?", FRIENDS).topic, "activities");
    assert.equal(parseTurn("Which activity could I attend with Arta?", FRIENDS).topic, "with-friend");
    assert.equal(parseTurn("How do I join this BRIDGE project?", FRIENDS).topic, "bridge-join");
    assert.equal(parseTurn("what are my plans", FRIENDS).topic, "my-plans");
    assert.equal(parseTurn("show me another", FRIENDS).isFollowUp, true);
  });

  it("resolves 'this weekend' against the simulated clock, not the real date", () => {
    // 2036-06-16 is a Monday → this weekend is Sat 21 – Sun 22 June; next weekend is 28 – 29 June.
    assert.deepEqual(weekendRange("2036-06-16", "this"), { from: "2036-06-21", to: "2036-06-22" });
    assert.deepEqual(weekendRange("2036-06-16", "next"), { from: "2036-06-28", to: "2036-06-29" });
    assert.deepEqual(weekendRange("2036-06-22", "this"), { from: "2036-06-21", to: "2036-06-22" }); // on a Sunday
    assert.equal(detectWeekendScope("what's on next weekend"), "next");
    assert.equal(detectWeekendScope("what's on tonight"), null);
  });
});

describe("transparent simulated friend replies and slots", () => {
  const friend = (availability: string) => ({ name: "Test Friend", interests: ["technology"], availability });
  const activity = (over: Partial<Parameters<typeof decideSimulatedReply>[0]["activity"]> = {}) => ({
    title: "Data night",
    date: "2036-06-24", // Tuesday
    startTime: "18:00",
    category: "technology",
    interestTags: ["technology"],
    accessibility: ["wheelchair-accessible"],
    isFull: false,
    ...over,
  });

  it("maps dates and times to availability slots", () => {
    assert.equal(slotOfActivity("2036-06-21", "10:00"), "weekends");
    assert.equal(slotOfActivity("2036-06-24", "18:00"), "weekday-evenings");
    assert.equal(slotOfActivity("2036-06-24", "09:00"), "weekday-mornings");
    assert.equal(slotOfActivity("2036-06-24", "14:00"), "weekday-afternoons");
  });

  it("accepts when free and interested, declines when unavailable / inaccessible / full, and leaves it open otherwise", () => {
    assert.equal(decideSimulatedReply({ friend: friend("weekday-evenings"), activity: activity() }).status, "ACCEPTED");
    assert.equal(decideSimulatedReply({ friend: friend("weekends"), activity: activity() }).status, "DECLINED");
    assert.equal(decideSimulatedReply({ friend: friend("weekday-evenings,needs-accessible"), activity: activity({ accessibility: [] }) }).status, "DECLINED");
    assert.equal(decideSimulatedReply({ friend: friend("weekday-evenings"), activity: activity({ isFull: true }) }).status, "DECLINED");
    assert.equal(decideSimulatedReply({ friend: friend("weekday-evenings"), activity: activity({ interestTags: ["cooking"] }) }).status, "PENDING");
    for (const s of ["ACCEPTED", "DECLINED", "PENDING"]) {
      const r = decideSimulatedReply({ friend: friend(s === "DECLINED" ? "weekends" : "weekday-evenings"), activity: activity(s === "PENDING" ? { interestTags: ["cooking"] } : {}) });
      assert.match(r.note, /^Simulated reply/);
    }
  });

  it("round-trips availability including the accessibility preference", () => {
    const raw = serializeAvailability(["weekends", "weekday-evenings"], true);
    assert.deepEqual(parseAvailability(raw), { slots: ["weekends", "weekday-evenings"], needsAccessible: true });
    assert.deepEqual(parseAvailability(null), { slots: [], needsAccessible: false });
  });
});

describe("BRIDGE stages", () => {
  const base = {
    communityAName: "A",
    communityBName: "B",
    needSupporters: 4,
    project: { volunteerCount: 3, volunteersNeeded: 12 },
    kickoff: { title: "Kickoff", date: "2036-06-25", isPast: false },
  } as const;

  it("an accepted proposal is done through the project and current at the first session", () => {
    const stages = computeBridgeStages({ ...base, status: "accepted" });
    assert.deepEqual(stages.map((s) => s.state), ["done", "done", "done", "done", "current"]);
    assert.match(stages[3].detail, /3 of 12/);
  });

  it("a suggested proposal is waiting on the organizers' decision", () => {
    const stages = computeBridgeStages({ ...base, status: "suggested", project: null, kickoff: null });
    assert.equal(stages[2].state, "current");
    assert.equal(stages[3].state, "upcoming");
  });

  it("a declined proposal stops and offers alternatives", () => {
    const input = { ...base, status: "declined" as const, project: null, kickoff: null };
    const stages = computeBridgeStages(input);
    assert.equal(stages[2].state, "blocked");
    assert.ok(!stages.some((s) => s.state === "current"));
    assert.equal(computeBridgeNextStep(input, { isVolunteer: false, hasKickoffRsvp: false }).kind, "explore");
  });

  it("the next step depends on what this viewer has already done", () => {
    const acc = { ...base, status: "accepted" as const };
    assert.equal(computeBridgeNextStep(acc, { isVolunteer: false, hasKickoffRsvp: false }).kind, "join-project");
    assert.equal(computeBridgeNextStep(acc, { isVolunteer: true, hasKickoffRsvp: false }).kind, "rsvp-kickoff");
    assert.equal(computeBridgeNextStep(acc, { isVolunteer: true, hasKickoffRsvp: true }).kind, "view-plan");
  });
});

describe("AI provider hook (server-side, honest fallback)", () => {
  it("is off by default and refuses to run without a key", async () => {
    assert.equal(isAiProviderConfigured(), false);
    await assert.rejects(() => generateGroundedText({ history: [], facts: {} }), AiProviderError);
  });

  const withKey = async (fn: () => Promise<void>) => {
    process.env.ASSISTANT_AI_API_KEY = "test-key";
    try {
      await fn();
    } finally {
      delete process.env.ASSISTANT_AI_API_KEY;
    }
  };

  it("sends the key only in the Authorization header, grounds the prompt in FACTS, and sanitizes the reply", async () => {
    await withKey(async () => {
      let seen: { url: string; init: RequestInit } | null = null;
      const fetchImpl = (async (url: string, init: RequestInit) => {
        seen = { url, init };
        return new Response(JSON.stringify({ choices: [{ message: { content: "Try **Golden Hour** <script>x</script> https://evil.example [link](https://evil.example)" } }] }), { status: 200 });
      }) as unknown as typeof fetch;
      const text = await generateGroundedText({ history: [{ role: "user", content: "hi" }], facts: { records: [1] }, fetchImpl });
      assert.ok(!/[*<]|https?:/.test(text), `unsafe content survived: ${text}`);
      assert.ok(seen);
      const s = seen as unknown as { url: string; init: RequestInit };
      assert.match(s.url, /\/chat\/completions$/);
      assert.equal((s.init.headers as Record<string, string>).Authorization, "Bearer test-key");
      assert.ok(!String(s.init.body).includes("test-key"), "the key never appears in the request body");
      assert.match(String(s.init.body), /FACTS/);
    });
  });

  it("turns HTTP errors, malformed bodies, timeouts and empty output into AiProviderError", async () => {
    await withKey(async () => {
      const mk = (impl: () => Promise<Response>) => ({ history: [], facts: {}, fetchImpl: impl as unknown as typeof fetch });
      await assert.rejects(() => generateGroundedText(mk(async () => new Response("no", { status: 500 }))), AiProviderError);
      await assert.rejects(() => generateGroundedText(mk(async () => new Response(JSON.stringify({ nope: 1 }), { status: 200 }))), AiProviderError);
      await assert.rejects(() => generateGroundedText(mk(async () => new Response(JSON.stringify({ choices: [{ message: { content: "   " } }] }), { status: 200 }))), AiProviderError);
      await assert.rejects(
        () => generateGroundedText(mk(async () => { const e = new Error("aborted"); e.name = "AbortError"; throw e; })),
        /timed out/
      );
      await assert.rejects(() => generateGroundedText(mk(async () => { throw new Error("network down"); })), AiProviderError);
    });
    assert.equal(sanitizeModelText("x".repeat(2000)).length <= 700, true);
  });
});

describe("assistant answers are grounded in stored records", () => {
  it("'What can I do this weekend?' returns only real, upcoming, open activities inside the simulated weekend", async () => {
    const v = await createDemoVisitor();
    const reply = await respondToChat({ messages: [{ role: "user", content: "What can I do this weekend?" }], state: { shownSlugs: [] }, viewerId: v.id, aiAllowed: false });
    assert.equal(reply.source, "rules");
    const cards = reply.cards.filter((c) => c.kind === "activity");
    assert.ok(cards.length > 0);
    for (const c of cards) {
      assert.ok(c.kind === "activity" && /2[12] June|Saturday|Sunday/.test(c.when), c.kind === "activity" ? c.when : "");
      assert.ok(c.kind === "activity" && c.spotsLeft > 0);
    }
    assert.match(reply.text, /2036-06-21 to 2036-06-22/);
  });

  it("'another' never repeats a shown activity, and states plainly when options run out", async () => {
    const v = await createDemoVisitor();
    const first = await respondToChat({ messages: [{ role: "user", content: "What can I do this weekend?" }], state: { shownSlugs: [] }, viewerId: v.id, aiAllowed: false });
    const shown = first.state.shownSlugs;
    const second = await respondToChat({
      messages: [{ role: "user", content: "What can I do this weekend?" }, { role: "assistant", content: first.text }, { role: "user", content: "another one?" }],
      state: first.state,
      viewerId: v.id,
      aiAllowed: false,
    });
    const secondSlugs = second.cards.flatMap((c) => (c.kind === "activity" ? [c.slug] : []));
    assert.ok(secondSlugs.every((s) => !shown.includes(s)), "no repeats");
  });

  it("'with Arta' suggests activities that fit both, with an Invite button — and does not invent actions", async () => {
    const v = await createDemoVisitor();
    const reply = await respondToChat({ messages: [{ role: "user", content: "Which activity could I attend with Arta?" }], state: { shownSlugs: [] }, viewerId: v.id, aiAllowed: false });
    assert.equal(reply.state.focusFriendId, "user-arta");
    const activity = reply.cards.find((c) => c.kind === "activity");
    assert.ok(activity && activity.kind === "activity" && activity.invite?.friendId === "user-arta");
    assert.match(reply.text, /can't send the invitation for you/);
    assert.equal(await (async () => (await import("@/lib/prisma")).prisma.activityInvite.count({ where: { fromUserId: v.id } }))(), 0, "asking never creates an invitation");
  });

  it("a friend who is not yet a friend is offered with an Add friend card, not activities", async () => {
    const v = await createDemoVisitor();
    const reply = await respondToChat({ messages: [{ role: "user", content: "What could I do with Lulzim?" }], state: { shownSlugs: [] }, viewerId: v.id, aiAllowed: false });
    assert.ok(reply.cards.some((c) => c.kind === "friend" && c.id === "friend-lulzim" && !c.isFriend));
    assert.ok(!reply.cards.some((c) => c.kind === "activity"));
  });

  it("explains how to join the BRIDGE project from the real showcase, and signed-out visitors are asked to log in", async () => {
    const v = await createDemoVisitor();
    const reply = await respondToChat({ messages: [{ role: "user", content: "How do I join this BRIDGE project?" }], state: { shownSlugs: [] }, viewerId: v.id, aiAllowed: false });
    const bridge = reply.cards.find((c) => c.kind === "bridge");
    assert.ok(bridge && bridge.kind === "bridge" && bridge.canJoin && bridge.projectId);
    assert.match(reply.text, /Prishtina AI Klub/);
    const anon = await respondToChat({ messages: [{ role: "user", content: "How do I join this BRIDGE project?" }], state: { shownSlugs: [] }, aiAllowed: false });
    assert.ok(anon.cards.some((c) => c.kind === "login"));
  });

  it("an unconfigured AI provider never claims to be AI", async () => {
    const v = await createDemoVisitor();
    const reply = await respondToChat({ messages: [{ role: "user", content: "hello" }], state: { shownSlugs: [] }, viewerId: v.id, aiAllowed: true });
    assert.equal(reply.source, "rules");
    assert.equal(reply.notice, undefined);
  });
});

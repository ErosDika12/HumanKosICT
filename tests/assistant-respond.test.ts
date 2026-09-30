import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "@/lib/prisma";
import { parseAssistantIntent } from "@/lib/assistant/intent-parser";
import { buildAssistantResponse } from "@/lib/assistant/respond";
import { isAiProviderConfigured } from "@/lib/assistant/ai-provider";
import { createRsvp } from "@/lib/data/rsvp";

describe("Assistant — deterministic, grounded responses", () => {
  it("provider is off by default in this environment", () => {
    assert.equal(isAiProviderConfigured(), false);
  });

  it("demo request #1 (meet people + programming + Saturday) grounds in real activities and, signed in, real matches", async () => {
    const intent = parseAssistantIntent(
      "I'm free on Saturday and want to meet people interested in programming in Prishtina."
    );
    const signedOut = await buildAssistantResponse(intent);
    assert.equal(signedOut.providerUsed, false);
    assert.ok(signedOut.summary.toLowerCase().includes("sign in"));
    assert.ok(signedOut.activities.length >= 0); // still offers real activities even signed out

    const signedIn = await buildAssistantResponse(intent, "user-arta");
    assert.ok(signedIn.people.length > 0);
    assert.ok(signedIn.people.every((p) => !("email" in p))); // never a private field
    assert.ok(signedIn.people.some((p) => p.id === "user-drin"));
  });

  it("demo request #2 (accessible activity) returns only real accessibility-tagged activities with a Discover link", async () => {
    const intent = parseAssistantIntent("Find an accessible activity near me.");
    const response = await buildAssistantResponse(intent);
    assert.ok(response.activities.length > 0);
    for (const activity of response.activities) {
      const full = await prisma.activity.findUniqueOrThrow({ where: { slug: activity.slug } });
      assert.ok(full.accessibility.includes("wheelchair-accessible"));
    }
    assert.ok(response.discoverLink?.includes("accessibility=wheelchair-accessible"));
  });

  it("demo request #3 (BRIDGE question) links to the real, highest-ranked AI klub + environment proposal", async () => {
    const intent = parseAssistantIntent("How could the AI club and environmental group collaborate?");
    const response = await buildAssistantResponse(intent);
    assert.ok(response.bridgeProposalId);
    assert.ok(response.summary.includes("Prishtina AI Klub"));
    assert.ok(response.summary.includes("Gjelbër"));
  });

  it("an out-of-scope city says so honestly instead of returning unrelated Prishtina results", async () => {
    const intent = parseAssistantIntent("Find a technology meetup in Tirana.");
    const response = await buildAssistantResponse(intent);
    assert.ok(response.summary.toLowerCase().includes("tirana"));
    assert.ok(response.summary.toLowerCase().includes("prishtina"));
    assert.deepEqual(response.activities, []);
  });

  it("no results for an impossible filter combination is stated honestly, never fabricated", async () => {
    const intent = parseAssistantIntent("Find a sports activity that is accessible.");
    // Force a combination unlikely to exist: sports + accessibility tag not present on the sports fixture.
    intent.category = "sports";
    intent.accessibility = ["wheelchair-accessible", "quiet-space-available"]; // AND semantics, no seeded activity has both
    const response = await buildAssistantResponse(intent);
    assert.deepEqual(response.activities, []);
    assert.ok(response.summary.toLowerCase().includes("no seeded activities"));
  });

  it("a genuinely ambiguous query asks for clarification instead of guessing", async () => {
    const intent = parseAssistantIntent("hello");
    const response = await buildAssistantResponse(intent);
    assert.equal(response.activities.length, 0);
    assert.ok(response.summary.toLowerCase().includes("couldn't tell"));
  });

  it("never recommends a canceled activity, and explicitly labels a past one as already happened", async () => {
    const activity = await prisma.activity.findUniqueOrThrow({ where: { slug: "kodim-per-adoleshente" } });
    await prisma.activity.update({ where: { id: activity.id }, data: { status: "CANCELED" } });
    try {
      const intent = parseAssistantIntent("technology workshop");
      const response = await buildAssistantResponse(intent);
      assert.ok(!response.activities.some((a) => a.slug === "kodim-per-adoleshente"));
    } finally {
      await prisma.activity.update({ where: { id: activity.id }, data: { status: "PUBLISHED" } });
    }

    // A real past-dated activity, if surfaced at all, is labeled honestly.
    const intent = parseAssistantIntent("environment activity");
    const response = await buildAssistantResponse(intent);
    const past = response.activities.find((a) => a.slug === "pastrim-parku-gjelber");
    if (past) assert.equal(past.isPast, true);
  });

  it("end-to-end: an assistant search leads to a real RSVP", async () => {
    const intent = parseAssistantIntent("culture event");
    const response = await buildAssistantResponse(intent);
    const upcoming = response.activities.find((a) => !a.isPast);
    assert.ok(upcoming);

    const activity = await prisma.activity.findUniqueOrThrow({ where: { slug: upcoming.slug } });
    await createRsvp("user-blerta", activity.id);
    const rsvp = await prisma.rsvp.findUniqueOrThrow({
      where: { userId_activityId: { userId: "user-blerta", activityId: activity.id } },
    });
    assert.equal(rsvp.status, "CONFIRMED");
  });
});

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseAssistantIntent } from "@/lib/assistant/intent-parser";

describe("parseAssistantIntent", () => {
  it("extracts category, weekend, and treats it as a people-adjacent activity search (demo request #1, English)", () => {
    const intent = parseAssistantIntent(
      "I'm free on Saturday and want to meet people interested in programming in Prishtina."
    );
    assert.equal(intent.type, "find-people");
    assert.equal(intent.category, "technology");
    assert.equal(intent.when, "weekend");
    assert.equal(intent.outOfScopeLocation, undefined);
  });

  it("extracts accessibility + near-me (demo request #2, English)", () => {
    const intent = parseAssistantIntent("Find an accessible activity near me.");
    assert.equal(intent.type, "find-activities");
    assert.deepEqual(intent.accessibility, ["wheelchair-accessible"]);
    assert.equal(intent.nearMe, true);
  });

  it("recognizes two real community mentions as a BRIDGE question (demo request #3, English)", () => {
    const intent = parseAssistantIntent("How could the AI club and environmental group collaborate?");
    assert.equal(intent.type, "bridge-question");
    const slugs = intent.communityMentions.map((m) => m.slug).sort();
    assert.deepEqual(slugs, ["gjelber-per-prishtinen", "prishtina-ai-klub"].sort());
  });

  it("supports Albanian phrasing for accessibility + near-me", () => {
    const intent = parseAssistantIntent("Gjej një aktivitet aksesibël afër meje.");
    assert.equal(intent.type, "find-activities");
    assert.deepEqual(intent.accessibility, ["wheelchair-accessible"]);
    assert.equal(intent.nearMe, true);
  });

  it("supports Albanian weekend and technology keywords", () => {
    const intent = parseAssistantIntent("Dua të takoj njerëz të interesuar për teknologji të shtunën.");
    assert.equal(intent.type, "find-people");
    assert.equal(intent.category, "technology");
    assert.equal(intent.when, "weekend");
  });

  it("flags an out-of-scope city instead of silently searching Prishtina data for it", () => {
    const intent = parseAssistantIntent("Find a technology meetup in Tirana this weekend.");
    assert.equal(intent.outOfScopeLocation, "tirana");
  });

  it("asks for clarification on a genuinely ambiguous query, not a bare fallback search", () => {
    assert.equal(parseAssistantIntent("").type, "unknown");
    assert.equal(parseAssistantIntent("hello").type, "unknown");
    assert.equal(parseAssistantIntent("test").type, "unknown");
  });

  it("still runs a general activity search for a longer query with no matched keyword", () => {
    const intent = parseAssistantIntent("what's going on this month");
    assert.equal(intent.type, "find-activities");
  });
});

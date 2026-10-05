import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  describeConstraints,
  extractConstraints,
  isRefinement,
  mergeConstraints,
  sanitizeConstraints,
  satisfies,
} from "@/lib/assistant/constraints";
import { matchesWindow, relativeDayLabel, windowRange } from "@/lib/time-window";

describe("simulated date windows (today = Monday 16 June 2036)", () => {
  it("resolves this week, this weekend and next weekend", () => {
    assert.deepEqual(windowRange("week", "2036-06-16"), { from: "2036-06-16", to: "2036-06-22" });
    assert.deepEqual(windowRange("weekend", "2036-06-16"), { from: "2036-06-21", to: "2036-06-22" });
    assert.deepEqual(windowRange("next-weekend", "2036-06-16"), { from: "2036-06-28", to: "2036-06-29" });
  });
  it("never calls 28 June 'this weekend' or a past date upcoming", () => {
    assert.equal(matchesWindow("2036-06-28", "weekend", "2036-06-16"), false);
    assert.equal(relativeDayLabel("2036-06-28", "2036-06-16"), "Next weekend");
    assert.equal(relativeDayLabel("2036-06-21", "2036-06-16"), "This weekend");
    assert.equal(relativeDayLabel("2036-06-14", "2036-06-16"), "Already happened");
    assert.equal(relativeDayLabel("2036-06-17", "2036-06-16"), "Tomorrow");
    assert.equal(relativeDayLabel("2036-06-25", "2036-06-16"), "Wed 25 Jun");
  });
});

describe("assistant constraint extraction", () => {
  it("reads location, date, cost and accessibility from one request", () => {
    const c = extractConstraints("Find a free wheelchair accessible activity in Dardania this weekend");
    assert.deepEqual(c, { area: "Prishtina — Dardania", cost: "free", accessibility: ["wheelchair-accessible"], window: "weekend" });
  });
  it("treats a short follow-up as a refinement that keeps earlier constraints", () => {
    const first = extractConstraints("Find a free wheelchair accessible activity in Dardania this weekend");
    assert.equal(isRefinement("Only in Dardania, please"), true);
    const merged = mergeConstraints(first, extractConstraints("Only in Dardania, please"));
    assert.deepEqual(merged, first);
    const narrowed = mergeConstraints(first, extractConstraints("what about the Center?"));
    assert.equal(narrowed.area, "Prishtina — Center");
    assert.equal(narrowed.window, "weekend");
    assert.equal(narrowed.cost, "free");
  });
  it("treats a complete new request as a new search", () => {
    assert.equal(isRefinement("What can I do this weekend?"), false);
    assert.equal(isRefinement("Find a technology activity for teens"), false);
  });
  it("whitelists constraints coming back from the browser", () => {
    assert.equal(sanitizeConstraints({ area: "Atlantis", cost: "gold", window: "forever" }), undefined);
    assert.deepEqual(sanitizeConstraints({ area: "Prishtina — Germia", window: "week", evil: 1 }), { area: "Prishtina — Germia", window: "week" });
  });
  it("describes active constraints for the reply", () => {
    assert.equal(
      describeConstraints({ cost: "free", accessibility: ["wheelchair-accessible"], area: "Prishtina — Dardania", window: "weekend" }),
      "free, wheelchair accessible, in Dardania, this weekend (21–22 June)"
    );
  });
});

describe("satisfies() hard constraints", () => {
  const photoWalk = { areaEn: "Prishtina — Center", cost: "free" as const, accessibility: ["wheelchair-accessible"], date: "2036-06-21", ageEligibility: "all-ages" as const, category: "culture" as const };
  it("rejects an activity in another area even if every other constraint matches", () => {
    assert.equal(satisfies(photoWalk, { area: "Prishtina — Dardania", cost: "free", window: "weekend", accessibility: ["wheelchair-accessible"] }), false);
    assert.equal(satisfies(photoWalk, { area: "Prishtina — Center", cost: "free", window: "weekend", accessibility: ["wheelchair-accessible"] }), true);
  });
  it("can relax area/date/cost for an alternative but never accessibility or eligibility", () => {
    const c = { area: "Prishtina — Dardania", accessibility: ["captioned"] };
    assert.equal(satisfies(photoWalk, c, ["area"]), false); // not captioned: still excluded when area is relaxed
    assert.equal(satisfies({ ...photoWalk, ageEligibility: "supervised-minors" }, {}), false); // minors-only is never offered by default
    assert.equal(satisfies({ ...photoWalk, ageEligibility: "supervised-minors" }, { eligibility: "supervised-minors" }), true);
  });
});

describe("Albanian follow-ups refine the previous search", () => {
  it("'Vetëm në Dardania, ju lutem' is a refinement and keeps the earlier constraints", () => {
    assert.equal(isRefinement("Vetëm në Dardania, ju lutem"), true);
    assert.equal(isRefinement("Çfarë mund të bëj këtë fundjavë?"), false);
    const first = extractConstraints("Gjej një aktivitet falas të qasshëm në Dardania këtë fundjavë");
    assert.deepEqual(first, { area: "Prishtina — Dardania", cost: "free", accessibility: ["wheelchair-accessible"], window: "weekend" });
    assert.deepEqual(mergeConstraints(first, extractConstraints("Vetëm në Dardania, ju lutem")), first);
  });
});

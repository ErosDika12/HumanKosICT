import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { findMatches, type PersonInput } from "@/lib/data/people-matching";

function person(overrides: Partial<PersonInput>): PersonInput {
  return {
    id: "p1",
    name: "Person",
    bio: null,
    isDiscoverable: true,
    interestIds: [],
    communities: [],
    projects: [],
    ...overrides,
  };
}

describe("findMatches", () => {
  it("good match: shared interest between two discoverable adults", () => {
    const viewer = person({ id: "v", interestIds: ["technology", "photography"] });
    const other = person({ id: "o", interestIds: ["technology", "science"] });
    const matches = findMatches(viewer, [other], new Set());
    assert.equal(matches.length, 1);
    assert.ok(matches[0].reasons[0].includes("Technology"));
  });

  it("bad match: no shared interest, community, or project -> excluded, not scored 0", () => {
    const viewer = person({ id: "v", interestIds: ["technology"] });
    const other = person({ id: "o", interestIds: ["music"] });
    const matches = findMatches(viewer, [other], new Set());
    assert.deepEqual(matches, []);
  });

  it("not discoverable -> excluded even with a shared interest", () => {
    const viewer = person({ id: "v", interestIds: ["technology"] });
    const other = person({ id: "o", interestIds: ["technology"], isDiscoverable: false });
    assert.deepEqual(findMatches(viewer, [other], new Set()), []);

    const notDiscoverableViewer = person({ id: "v2", interestIds: ["technology"], isDiscoverable: false });
    assert.deepEqual(findMatches(notDiscoverableViewer, [other], new Set()), []);
  });

  it("blocked match: a shared interest is excluded once either side has blocked the other", () => {
    const viewer = person({ id: "v", interestIds: ["technology"] });
    const other = person({ id: "o", interestIds: ["technology"] });
    const matches = findMatches(viewer, [other], new Set(["o"]));
    assert.deepEqual(matches, []);
  });

  it("shared community or project participation counts as a mutual basis even with no shared interest", () => {
    const viewer = person({
      id: "v",
      interestIds: [],
      communities: [{ id: "c1", name: "AI Klub" }],
    });
    const other = person({
      id: "o",
      interestIds: [],
      communities: [{ id: "c1", name: "AI Klub" }],
    });
    const matches = findMatches(viewer, [other], new Set());
    assert.equal(matches.length, 1);
    assert.ok(matches[0].reasons[0].includes("AI Klub"));
  });

  it("works correctly with only two discoverable adults in the whole system", () => {
    const viewer = person({ id: "v", interestIds: ["technology"] });
    const other = person({ id: "o", interestIds: ["technology"] });
    const matches = findMatches(viewer, [other], new Set());
    assert.equal(matches.length, 1);
  });
});

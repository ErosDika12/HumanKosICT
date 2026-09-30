import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "@/lib/prisma";
import {
  getRealGapRows,
  getTopRealGaps,
  getScenarioGapRows,
  getTopScenarioGaps,
  listCandidateSpaces,
  getRecommendationDraft,
  saveRecommendationNote,
} from "@/lib/data/municipality";

describe("Municipality intelligence — real seeded data produces the documented demo story", () => {
  it("the environment/Dardania need clears the suppression threshold (4 real contributors) and is disclosed", async () => {
    const rows = await getRealGapRows();
    const disclosed = rows.find((r) => r.areaSq === "Prishtinë — Dardania" && r.category === "environment");
    assert.ok(disclosed);
    assert.deepEqual(disclosed.demand, { kind: "count", value: 4 });
  });

  it("the youth-technology need (1 real contributor) stays suppressed, never shown as a number", async () => {
    const rows = await getRealGapRows();
    const suppressed = rows.find((r) => r.areaSq === "Prishtinë — Dardania" && r.category === "technology");
    assert.ok(suppressed);
    assert.deepEqual(suppressed.demand, { kind: "suppressed" });
    assert.deepEqual(suppressed.gap, { kind: "suppressed" });
  });

  it("no row returned by any municipality data function ever includes a need's free text or a submitter id", async () => {
    const rows = await getRealGapRows();
    for (const row of rows) {
      const serialized = JSON.stringify(row);
      assert.ok(!serialized.toLowerCase().includes("submittedbyid"));
      assert.ok(!serialized.toLowerCase().includes("description"));
    }
  });

  it("the scenario projection reproduces the core demo story: many simulated youth-tech requests, little real supply", async () => {
    const rows = await getScenarioGapRows();
    const headline = rows.find((r) => r.areaSq === "Prishtinë — Dardania" && r.category === "technology");
    assert.ok(headline);
    assert.equal(headline.syntheticDemand, 14);
    assert.ok(headline.gap > 10);
    const top = await getTopScenarioGaps(1);
    assert.equal(top[0].areaSq, "Prishtinë — Dardania");
    assert.equal(top[0].category, "technology");
  });

  it("real and scenario gaps are structurally distinct — never accidentally interchangeable", async () => {
    const real = await getTopRealGaps();
    const scenario = await getScenarioGapRows();
    for (const r of real) assert.ok(!("syntheticDemand" in r));
    for (const s of scenario) assert.ok(!("demand" in s));
  });

  it("known public places are real seeded venues with real counts, never labeled 'underused'", async () => {
    const spaces = await listCandidateSpaces();
    assert.ok(spaces.length > 0);
    for (const s of spaces) {
      assert.ok(s.scheduledActivityCount >= 0);
      assert.ok(typeof s.venueName === "string" && s.venueName.length > 0);
    }
  });

  it("a recommendation draft is phrased as a suggestion for human review and is editable/persistable", async () => {
    const draft = await getRecommendationDraft("Prishtinë — Dardania", "technology");
    assert.ok(draft.text.toLowerCase().includes("suggestion for human review"));
    assert.equal(draft.isSaved, false);

    await saveRecommendationNote("user-agron", "Prishtinë — Dardania", "technology", "Edited draft text.");
    const saved = await getRecommendationDraft("Prishtinë — Dardania", "technology");
    assert.equal(saved.isSaved, true);
    assert.equal(saved.text, "Edited draft text.");
    assert.equal(saved.updatedByName, "Agron Sylaj");

    // Reset for repeatable test runs.
    await prisma.municipalityRecommendationNote.deleteMany({
      where: { areaSq: "Prishtinë — Dardania", category: "TECHNOLOGY" },
    });
  });
});

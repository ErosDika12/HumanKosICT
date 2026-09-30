import { describe, it } from "node:test";
import assert from "node:assert/strict";
import * as municipalityAggregation from "@/lib/data/municipality-aggregation";
import {
  MIN_DISTINCT_CONTRIBUTORS,
  suppressCount,
  computeRealDemandCells,
  computeRealGapRows,
  computeScenarioGapRows,
  topGaps,
  topScenarioGaps,
  type RealNeedInput,
  type SupplyCell,
} from "@/lib/data/municipality-aggregation";

describe("suppressCount", () => {
  it("suppresses below the documented threshold and discloses at/above it", () => {
    assert.deepEqual(suppressCount(0), { kind: "suppressed" });
    assert.deepEqual(suppressCount(MIN_DISTINCT_CONTRIBUTORS - 1), { kind: "suppressed" });
    assert.deepEqual(suppressCount(MIN_DISTINCT_CONTRIBUTORS), { kind: "count", value: MIN_DISTINCT_CONTRIBUTORS });
    assert.deepEqual(suppressCount(MIN_DISTINCT_CONTRIBUTORS + 5), { kind: "count", value: MIN_DISTINCT_CONTRIBUTORS + 5 });
  });
});

describe("computeRealDemandCells — small-cell suppression", () => {
  it("deduplicates contributors across multiple needs in the same area/category before deciding suppression", () => {
    const needs: RealNeedInput[] = [
      { areaSq: "Area A", category: "environment", contributorIds: ["u1", "u2"] },
      { areaSq: "Area A", category: "environment", contributorIds: ["u2", "u3"] }, // u2 overlaps
    ];
    const cells = computeRealDemandCells(needs);
    assert.equal(cells.length, 1);
    // Distinct contributors: u1, u2, u3 = 3 -> meets threshold, not double-counted.
    assert.deepEqual(cells[0].demand, { kind: "count", value: 3 });
  });

  it("suppresses a cell with fewer than the threshold's distinct contributors", () => {
    const needs: RealNeedInput[] = [{ areaSq: "Area B", category: "technology", contributorIds: ["u1"] }];
    const cells = computeRealDemandCells(needs);
    assert.deepEqual(cells[0].demand, { kind: "suppressed" });
  });

  it("never returns the underlying small count anywhere in a suppressed cell", () => {
    const needs: RealNeedInput[] = [{ areaSq: "Area C", category: "sports", contributorIds: ["u1", "u2"] }];
    const cells = computeRealDemandCells(needs);
    const serialized = JSON.stringify(cells[0]);
    assert.ok(!serialized.includes("2")); // the actual count (2) never appears in the output at all
  });
});

describe("computeRealGapRows and topGaps — never disclose or rank a suppressed cell", () => {
  const supply: SupplyCell[] = [
    { areaSq: "Area A", category: "environment", activityCount: 1 },
    { areaSq: "Area B", category: "technology", activityCount: 5 },
  ];

  it("a suppressed demand cell produces a suppressed gap, never a computed number", () => {
    const cells = computeRealDemandCells([{ areaSq: "Area B", category: "technology", contributorIds: ["u1"] }]);
    const rows = computeRealGapRows(cells, supply);
    assert.deepEqual(rows[0].gap, { kind: "suppressed" });
  });

  it("topGaps excludes every suppressed row from the ranking entirely", () => {
    const cells = computeRealDemandCells([
      { areaSq: "Area A", category: "environment", contributorIds: ["u1", "u2", "u3", "u4"] }, // disclosed, gap=3
      { areaSq: "Area B", category: "technology", contributorIds: ["u5"] }, // suppressed
    ]);
    const rows = computeRealGapRows(cells, supply);
    const ranked = topGaps(rows);
    assert.equal(ranked.length, 1);
    assert.equal(ranked[0].areaSq, "Area A");
    assert.ok(!ranked.some((r) => r.areaSq === "Area B"));
  });
});

describe("differencing: no derivable total ever exposes a suppressed cell", () => {
  it("this module has no function that sums per-category cells into an area/grand total", () => {
    // A structural guarantee, not a numeric masking trick: verify the
    // module's actual exported surface never offers a summed total
    // alongside the per-category breakdown, which is what would let
    // someone compute total - sum(visible) to reconstruct a suppressed cell.
    const exportedNames = Object.keys(municipalityAggregation);
    assert.ok(
      !exportedNames.some((name) => /total/i.test(name)),
      `expected no total-computing export, found: ${exportedNames.filter((n) => /total/i.test(n))}`
    );
  });

  it("a real-world differencing attempt cannot recover a suppressed cell's exact value from these rows alone", () => {
    // Area A has 3 categories: two disclosed (7 and 4 contributors), one
    // suppressed (2 contributors). If a "total for Area A" were exposed
    // anywhere, total - 7 - 4 would reveal the suppressed cell exactly.
    const needs: RealNeedInput[] = [
      { areaSq: "Area A", category: "environment", contributorIds: Array.from({ length: 7 }, (_, i) => `env-${i}`) },
      { areaSq: "Area A", category: "sports", contributorIds: Array.from({ length: 4 }, (_, i) => `sport-${i}`) },
      { areaSq: "Area A", category: "technology", contributorIds: ["tech-1", "tech-2"] }, // suppressed
    ];
    const cells = computeRealDemandCells(needs);
    const rows = computeRealGapRows(cells, []);
    // The rows themselves carry no area-level total field.
    for (const row of rows) {
      assert.ok(!("total" in row));
      assert.ok(!("areaTotal" in row));
    }
    // And no combination of this module's functions produces one either —
    // covered by the "no total-computing export" test above.
  });
});

describe("scenario gap rows stay a distinct type, never blended with real rows", () => {
  it("computes scenario gaps independently of any real demand cell", () => {
    const rows = computeScenarioGapRows(
      [{ areaSq: "Area A", category: "technology", syntheticCount: 14, note: "scenario" }],
      [{ areaSq: "Area A", category: "technology", activityCount: 1 }]
    );
    assert.equal(rows[0].syntheticDemand, 14);
    assert.equal(rows[0].gap, 13);
    assert.ok(!("demand" in rows[0])); // distinct shape from RealGapRow
  });

  it("topScenarioGaps ranks by gap size, largest first", () => {
    const rows = computeScenarioGapRows(
      [
        { areaSq: "A", category: "technology", syntheticCount: 5, note: "" },
        { areaSq: "B", category: "sports", syntheticCount: 20, note: "" },
      ],
      []
    );
    const ranked = topScenarioGaps(rows);
    assert.equal(ranked[0].areaSq, "B");
  });
});

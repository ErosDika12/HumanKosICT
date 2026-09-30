import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "@/lib/prisma";
import { listAttendeesForOrganizer, markAttendance, unmarkAttendance, AttendanceError } from "@/lib/data/attendance";
import { CommunityAuthorizationError } from "@/lib/data/communities";
import { getImpactSummary } from "@/lib/data/impact";

describe("Attendance check-in (organizer-only, simulated-clock gated)", () => {
  it("refuses check-in for an activity that hasn't happened yet, even for its organizer", async () => {
    const upcoming = await prisma.activity.findUniqueOrThrow({
      where: { slug: "shetitje-fotografike-qender" }, // 2036-06-21, upcoming
    });
    await assert.rejects(
      () => listAttendeesForOrganizer("user-yll", upcoming.id),
      AttendanceError
    );
    await assert.rejects(() => markAttendance("user-yll", upcoming.id, "user-arta"), AttendanceError);
  });

  it("refuses check-in for a non-organizer, even for a past activity", async () => {
    const past = await prisma.activity.findUniqueOrThrow({
      where: { slug: "punetori-ai-fillestare" }, // 2036-06-13, past
    });
    await assert.rejects(
      () => listAttendeesForOrganizer("user-blerta", past.id),
      CommunityAuthorizationError
    );
  });

  it("lets the organizer mark and unmark attendance for a past activity's RSVP holders", async () => {
    const past = await prisma.activity.findUniqueOrThrow({
      where: { slug: "pastrim-parku-gjelber" }, // 2036-06-14, past
    });
    // Real RSVP creation now correctly refuses a past activity (see
    // tests/rsvp.test.ts) — this row simulates one made back when the
    // event was still upcoming, exactly like the seeded fixtures do.
    await prisma.rsvp.upsert({
      where: { userId_activityId: { userId: "user-blerta", activityId: past.id } },
      create: { userId: "user-blerta", activityId: past.id, status: "CONFIRMED" },
      update: { status: "CONFIRMED" },
    });

    const before = await listAttendeesForOrganizer("user-fatlume", past.id);
    const blertaRow = before.find((a) => a.userId === "user-blerta");
    assert.ok(blertaRow);
    assert.equal(blertaRow.attended, false);

    await markAttendance("user-fatlume", past.id, "user-blerta");
    const after = await listAttendeesForOrganizer("user-fatlume", past.id);
    assert.equal(after.find((a) => a.userId === "user-blerta")?.attended, true);

    await unmarkAttendance("user-fatlume", past.id, "user-blerta");
    const reverted = await listAttendeesForOrganizer("user-fatlume", past.id);
    assert.equal(reverted.find((a) => a.userId === "user-blerta")?.attended, false);
  });
});

describe("Impact derivation — only real stored actions, no fabricated figures", () => {
  it("derives Arta's attended events, joined projects, and communities from real rows", async () => {
    const impact = await getImpactSummary("user-arta");

    // Seeded fixtures: Arta attended the AI workshop (organizer-confirmed),
    // volunteers on the Dardania park project, and is a member of the AI klub.
    const aiWorkshopAttendance = impact.attendedEvents.find((e) => e.activitySlug === "punetori-ai-fillestare");
    assert.ok(aiWorkshopAttendance);
    assert.equal(aiWorkshopAttendance.confirmedByName, "Drin Gashi");
    assert.ok(impact.joinedProjects.some((p) => p.projectSlug === "kujdesi-per-parkun-dardania"));
    assert.ok(impact.communities.some((c) => c.communitySlug === "prishtina-ai-klub"));

    // No hours field anywhere in the derived summary.
    for (const event of impact.attendedEvents) {
      assert.ok(!("hours" in event));
    }
  });

  it("a member with no stored actions gets an empty, honest summary", async () => {
    const impact = await getImpactSummary("user-agron"); // municipality analyst, no activity here
    assert.deepEqual(impact.attendedEvents, []);
    assert.deepEqual(impact.joinedProjects, []);
    assert.deepEqual(impact.communities, []);
  });
});

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "@/lib/prisma";
import {
  createActivity,
  updateActivity,
  cancelActivity,
  ActivityValidationError,
  type ActivityInput,
} from "@/lib/data/organizer-activities";
import { CommunityAuthorizationError } from "@/lib/data/communities";
import { createRsvp } from "@/lib/data/rsvp";

function fixtureInput(overrides: Partial<ActivityInput> = {}): ActivityInput {
  return {
    title: "Test Organizer Event",
    titleSq: "Test Organizer Event (sq)",
    summary: "A test event",
    summarySq: "A test event (sq)",
    category: "technology",
    areaSq: "Prishtinë — Test",
    areaEn: "Prishtina — Test",
    venueName: "Test Venue",
    lat: 42.6653,
    lng: 21.1622,
    date: "2036-06-22",
    startTime: "18:00",
    capacity: 10,
    cost: "free",
    indoor: true,
    accessibility: [],
    ageEligibility: "all-ages",
    difficulty: "all-levels",
    description: "Test description",
    descriptionSq: "Test description (sq)",
    interestTags: ["technology"],
    ...overrides,
  };
}

describe("Organizer activity CRUD authorization and state transitions", () => {
  it("only the community's organizer can create an activity for it, and it starts DRAFT", async () => {
    await assert.rejects(
      () => createActivity("user-blerta", "prishtina-ai-klub", fixtureInput()),
      CommunityAuthorizationError
    );

    const slug = await createActivity("user-drin", "prishtina-ai-klub", fixtureInput());
    const created = await prisma.activity.findUniqueOrThrow({ where: { slug } });
    assert.equal(created.status, "DRAFT");

    // DRAFT activities never appear in discovery.
    const { listActivities } = await import("@/lib/data/activities");
    const discoverable = await listActivities();
    assert.ok(!discoverable.some((a) => a.slug === slug));

    await prisma.activity.delete({ where: { slug } });
  });

  it("rejects invalid input server-side (never trusts the client alone)", async () => {
    await assert.rejects(
      () => createActivity("user-drin", "prishtina-ai-klub", fixtureInput({ capacity: 0 })),
      ActivityValidationError
    );
    await assert.rejects(
      () => createActivity("user-drin", "prishtina-ai-klub", fixtureInput({ date: "22-06-2036" })),
      ActivityValidationError
    );
    await assert.rejects(
      () => createActivity("user-drin", "prishtina-ai-klub", fixtureInput({ cost: "paid", costDetail: "" })),
      ActivityValidationError
    );
  });

  it("only the organizer can update or cancel; a schedule change notifies RSVP holders", async () => {
    const slug = await createActivity("user-drin", "prishtina-ai-klub", fixtureInput());
    const created = await prisma.activity.findUniqueOrThrow({ where: { slug } });
    // Publish it manually (bypassing the moderator UI) so an RSVP is possible.
    await prisma.activity.update({ where: { id: created.id }, data: { status: "PUBLISHED" } });
    await createRsvp("user-arta", created.id);

    await assert.rejects(
      () => updateActivity("user-blerta", slug, fixtureInput({ venueName: "Hijacked venue" })),
      CommunityAuthorizationError
    );

    await updateActivity("user-drin", slug, fixtureInput({ venueName: "New Venue", date: "2036-06-25" }));
    const notifications = await prisma.notification.findMany({
      where: { userId: "user-arta", activityId: created.id },
    });
    assert.ok(notifications.some((n) => /changed its date/i.test(n.message)));

    await assert.rejects(() => cancelActivity("user-blerta", slug), CommunityAuthorizationError);
    await cancelActivity("user-drin", slug);
    const canceled = await prisma.activity.findUniqueOrThrow({ where: { slug } });
    assert.equal(canceled.status, "CANCELED");
    const cancelNotifications = await prisma.notification.findMany({
      where: { userId: "user-arta", activityId: created.id, message: { contains: "canceled" } },
    });
    assert.ok(cancelNotifications.length > 0);

    await prisma.activity.delete({ where: { slug } });
  });
});

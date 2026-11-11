import { describe, it, after } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "@/lib/prisma";
import type { Actor, RoleName } from "@/lib/auth/roles";
import { PermissionError } from "@/lib/auth/roles";
import { followNeighborhood, listFollowedSlugs, unfollowNeighborhood } from "@/lib/data/follows";
import {
  archiveNotice,
  createNotice,
  createService,
  isReviewStale,
  listActiveNotices,
  listPublishedServices,
} from "@/lib/data/city";
import {
  countSimilarOpenIssues,
  createIssue,
  getMyIssue,
  listIssueQueue,
  listMyIssues,
  publicIssueCounts,
  updateIssueStatus,
} from "@/lib/data/issues";
import { createProposal, hideProposal, listOpenProposals, toggleProposalSupport } from "@/lib/data/proposals";
import { addProjectUpdate, completeProject, createProject, getProjectBySlug, planProject, startProject } from "@/lib/data/projects";
import { deriveProjectStage } from "@/lib/project-stage";
import { CATALOG } from "@/lib/i18n/catalog";

const created: string[] = [];
let counter = 0;

async function makeActor(role: RoleName, extra: { isDemoPersona?: boolean } = {}): Promise<Actor> {
  const id = `test-city-${role.toLowerCase()}-${Date.now()}-${counter++}`;
  await prisma.user.create({
    data: { id, email: `${id}@test.local`, passwordHash: "not-a-real-hash", name: `Test ${role}`, role, isDemoPersona: extra.isDemoPersona ?? false },
  });
  created.push(id);
  return { id, role, isDemoPersona: extra.isDemoPersona ?? false };
}

const MODERATOR: Actor = { id: "user-elmedina", role: "MODERATOR", isDemoPersona: true };

after(async () => {
  // Cascades remove each throwaway user's follows, reports, proposals and supports.
  await prisma.user.deleteMany({ where: { id: { in: created } } });
});

describe("neighborhood follows", () => {
  it("follows several neighborhoods by hand, idempotently, and unfollows", async () => {
    const u = await makeActor("MEMBER");
    await followNeighborhood(u.id, "qender");
    await followNeighborhood(u.id, "qender");
    await followNeighborhood(u.id, "dardania");
    assert.deepEqual((await listFollowedSlugs(u.id)).sort(), ["dardania", "qender"]);
    await unfollowNeighborhood(u.id, "qender");
    assert.deepEqual(await listFollowedSlugs(u.id), ["dardania"]);
  });

  it("rejects a neighborhood that does not exist", async () => {
    const u = await makeActor("MEMBER");
    await assert.rejects(() => followNeighborhood(u.id, "atlantis"), /Unknown neighborhood/);
  });

  it("keeps one person's follows invisible to another", async () => {
    const a = await makeActor("MEMBER");
    const b = await makeActor("MEMBER");
    await followNeighborhood(a.id, "germia");
    assert.deepEqual(await listFollowedSlugs(b.id), []);
  });
});

describe("city services and notices", () => {
  const service = {
    name: "Test registry office",
    nameSq: "Zyra e testimit",
    description: "What it does.",
    descriptionSq: "Çfarë bën.",
    category: "documents",
    officialUrl: "https://example.org/registry",
    sourceName: "Example source",
    reviewedAt: new Date(),
  };

  it("lets only a moderator publish, and refuses an ordinary member", async () => {
    const member = await makeActor("MEMBER");
    await assert.rejects(() => createService(member, { ...service, publish: true }), PermissionError);
    await assert.rejects(() => createNotice(member, { title: "t", titleSq: "t", body: "b", bodySq: "b", sourceName: "s", publishedAt: new Date() }), PermissionError);
  });

  it("shows only published services, never drafts, and requires a safe official link", async () => {
    const draftId = await createService(MODERATOR, { ...service, name: "Draft only service", publish: false });
    const liveId = await createService(MODERATOR, { ...service, name: "Live service", publish: true });
    const names = (await listPublishedServices()).map((s) => s.name);
    assert.ok(names.includes("Live service"));
    assert.ok(!names.includes("Draft only service"));
    await assert.rejects(() => createService(MODERATOR, { ...service, officialUrl: "javascript:alert(1)", publish: true }), /valid http/);
    await assert.rejects(() => createService(MODERATOR, { ...service, sourceName: "  ", publish: true }), /Source is required/);
    await prisma.cityService.deleteMany({ where: { id: { in: [draftId, liveId] } } });
  });

  it("flags review dates older than 180 days as stale", () => {
    const now = new Date("2026-11-11T00:00:00Z");
    assert.equal(isReviewStale(new Date("2026-10-01T00:00:00Z"), now), false);
    assert.equal(isReviewStale(new Date("2026-03-01T00:00:00Z"), now), true);
  });

  it("hides expired, future and archived notices automatically", async () => {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    const base = { titleSq: "t", body: "b", bodySq: "b", sourceName: "Source" };
    const active = await createNotice(MODERATOR, { ...base, title: "Active notice", publishedAt: new Date(now - day), expiresAt: new Date(now + day) });
    const expired = await createNotice(MODERATOR, { ...base, title: "Expired notice", publishedAt: new Date(now - 3 * day), expiresAt: new Date(now - day) });
    const future = await createNotice(MODERATOR, { ...base, title: "Future notice", publishedAt: new Date(now + day) });
    const archived = await createNotice(MODERATOR, { ...base, title: "Archived notice", publishedAt: new Date(now - day) });
    await archiveNotice(MODERATOR, archived);

    const titles = (await listActiveNotices()).map((n) => n.title);
    assert.ok(titles.includes("Active notice"));
    assert.ok(!titles.includes("Expired notice"));
    assert.ok(!titles.includes("Future notice"));
    assert.ok(!titles.includes("Archived notice"));
    await assert.rejects(
      () => createNotice(MODERATOR, { ...base, title: "Bad expiry", publishedAt: new Date(now), expiresAt: new Date(now - day) }),
      /Expiry must be after/
    );
    await prisma.cityNotice.deleteMany({ where: { id: { in: [active, expired, future, archived] } } });
  });
});

describe("issue reports — privacy and truthful status", () => {
  const input = { category: "lighting", description: "The street light by the school is out.", areaSlug: "qender" };

  it("starts as 'Received by Human Network' and says nothing about any municipality", async () => {
    const u = await makeActor("MEMBER");
    const id = await createIssue(u, input);
    const mine = await getMyIssue(u.id, id);
    assert.equal(mine?.status, "RECEIVED");
    assert.equal(mine?.events.length, 1);
    assert.equal(mine?.events[0].status, "RECEIVED");
    // The wording a person sees for this status, in both languages, claims nothing about a municipality.
    const label = CATALOG["issue.status.RECEIVED"];
    assert.match(label.en, /Received by Human Network/);
    assert.doesNotMatch(label.en + label.sq, /municipal|komun/i);
  });

  it("keeps one person's reports and history private from another person", async () => {
    const a = await makeActor("MEMBER");
    const b = await makeActor("MEMBER");
    const id = await createIssue(a, input);
    assert.equal(await getMyIssue(b.id, id), null);
    assert.deepEqual(await listMyIssues(b.id), []);
    assert.equal((await listMyIssues(a.id)).length, 1);
  });

  it("validates input and limits how many reports one person can file in a day", async () => {
    const u = await makeActor("MEMBER");
    await assert.rejects(() => createIssue(u, { ...input, category: "dragons" }), /valid category/);
    await assert.rejects(() => createIssue(u, { ...input, areaSlug: "atlantis" }), /Unknown neighborhood/);
    await assert.rejects(() => createIssue(u, { ...input, description: "short" }), /at least 10/);
    await assert.rejects(() => createIssue(u, { ...input, latitude: 42.6 }), /required together/);
    await assert.rejects(() => createIssue(u, { ...input, latitude: 999, longitude: 21 }), /not valid/);
    for (let i = 0; i < 5; i++) await createIssue(u, input);
    await assert.rejects(() => createIssue(u, input), /limit reached/);
  });

  it("counts similar open reports without revealing anyone's text", async () => {
    const before = await countSimilarOpenIssues("water", "ulpiana");
    const u = await makeActor("MEMBER");
    await createIssue(u, { category: "water", description: "A pipe is leaking onto the road.", areaSlug: "ulpiana" });
    assert.equal(await countSimilarOpenIssues("water", "ulpiana"), before + 1);
    assert.equal(typeof (await countSimilarOpenIssues("water", "ulpiana")), "number");
    assert.equal(await countSimilarOpenIssues("dragons", "ulpiana"), 0);
  });

  it("limits the moderator queue to staff and leaves the reporter out of it", async () => {
    const member = await makeActor("MEMBER");
    await assert.rejects(() => listIssueQueue(member), PermissionError);
    const queue = await listIssueQueue(MODERATOR);
    for (const row of queue) assert.ok(!("reporterId" in row));
  });

  it("lets a moderator review, merge duplicates and decline — and records each step for the reporter", async () => {
    const u = await makeActor("MEMBER");
    const first = await createIssue(u, input);
    const second = await createIssue(u, input);
    await updateIssueStatus(MODERATOR, first, "UNDER_REVIEW");
    await assert.rejects(() => updateIssueStatus(MODERATOR, second, "DUPLICATE"), /Choose the report/);
    await assert.rejects(() => updateIssueStatus(MODERATOR, second, "DUPLICATE", { duplicateOfId: second }), /Choose the report/);
    await updateIssueStatus(MODERATOR, second, "DUPLICATE", { duplicateOfId: first });
    await assert.rejects(() => updateIssueStatus(MODERATOR, first, "DECLINED"), /note is required/i);
    await updateIssueStatus(MODERATOR, first, "DECLINED", { note: "Outside what we can pass on." });

    const mine = await getMyIssue(u.id, first);
    assert.deepEqual(mine?.events.map((e) => e.status), ["RECEIVED", "UNDER_REVIEW", "DECLINED"]);
    // Final states cannot be changed again.
    await assert.rejects(() => updateIssueStatus(MODERATOR, first, "UNDER_REVIEW"), /not allowed/);
  });

  it("refuses to let a member, a moderator or a demo analyst claim municipal acknowledgement", async () => {
    const reporter = await makeActor("MEMBER");
    const id = await createIssue(reporter, input);
    const member = await makeActor("MEMBER");
    await assert.rejects(() => updateIssueStatus(member, id, "UNDER_REVIEW"), PermissionError);
    await assert.rejects(() => updateIssueStatus(MODERATOR, id, "MUNICIPALITY_ACKNOWLEDGED", { note: "ref 1" }), PermissionError);
    const demoAnalyst: Actor = { id: "user-agron", role: "MUNICIPALITY_ANALYST", isDemoPersona: true };
    await assert.rejects(() => updateIssueStatus(demoAnalyst, id, "MUNICIPALITY_ACKNOWLEDGED", { note: "ref 1" }), PermissionError);
    assert.equal((await getMyIssue(reporter.id, id))?.status, "RECEIVED");
  });

  it("lets a real authorized partner record acknowledgement and resolution, each with a reference", async () => {
    const reporter = await makeActor("MEMBER");
    const id = await createIssue(reporter, input);
    const partner = await makeActor("MUNICIPALITY_ANALYST");
    await assert.rejects(() => updateIssueStatus(partner, id, "MUNICIPALITY_ACKNOWLEDGED"), /reference note/);
    await updateIssueStatus(partner, id, "MUNICIPALITY_ACKNOWLEDGED", { note: "Ticket 2026-118" });
    await updateIssueStatus(partner, id, "RESOLVED", { note: "Lamp replaced, ticket closed." });
    assert.deepEqual((await getMyIssue(reporter.id, id))?.events.map((e) => e.status), ["RECEIVED", "MUNICIPALITY_ACKNOWLEDGED", "RESOLVED"]);
  });

  it("publishes only counts per neighborhood and status — no text, coordinates or people", async () => {
    const u = await makeActor("MEMBER");
    await createIssue(u, { ...input, latitude: 42.66, longitude: 21.16 });
    const counts = await publicIssueCounts();
    assert.ok(counts.length > 0);
    for (const row of counts) assert.deepEqual(Object.keys(row).sort(), ["areaSlug", "count", "status"]);
  });
});

describe("community proposals", () => {
  it("creates, supports once, and un-supports; the author is never exposed", async () => {
    const author = await makeActor("MEMBER");
    const other = await makeActor("MEMBER");
    const id = await createProposal(author, { title: "More benches in the park", body: "Benches along the main path.", areaSlug: "germia" });
    assert.equal(await toggleProposalSupport(other.id, id), true);
    const seen = (await listOpenProposals(other.id)).find((p) => p.id === id);
    assert.equal(seen?.supportCount, 1);
    assert.equal(seen?.isSupportedByViewer, true);
    assert.ok(!("authorId" in (seen ?? {})));
    assert.equal(await toggleProposalSupport(other.id, id), false);
    assert.equal((await listOpenProposals()).find((p) => p.id === id)?.supportCount, 0);
  });

  it("validates input, limits daily proposals, and lets only a moderator hide one", async () => {
    const u = await makeActor("MEMBER");
    await assert.rejects(() => createProposal(u, { title: "", body: "x" }), /Title is required/);
    await assert.rejects(() => createProposal(u, { title: "x", body: "y", areaSlug: "atlantis" }), /Unknown neighborhood/);
    const ids: string[] = [];
    for (let i = 0; i < 3; i++) ids.push(await createProposal(u, { title: `Idea ${i}`, body: "Body" }));
    await assert.rejects(() => createProposal(u, { title: "One more", body: "Body" }), /limit reached/);
    await assert.rejects(() => hideProposal(u, ids[0]), PermissionError);
    await hideProposal(MODERATOR, ids[0]);
    assert.ok(!(await listOpenProposals()).some((p) => p.id === ids[0]));
  });
});

describe("BRIDGE / neighborhood project workflow", () => {
  async function newProject() {
    const community = await prisma.community.findFirstOrThrow({ where: { organizerId: "user-drin", status: "PUBLISHED" } });
    const slug = await createProject("user-drin", community.slug, {
      title: `Workflow test ${Date.now()}-${counter++}`,
      titleSq: "Test",
      description: "Clean the pocket park.",
      descriptionSq: "Pastro parkun.",
      volunteersNeeded: 4,
    });
    const project = await prisma.project.findUniqueOrThrow({ where: { slug } });
    return { slug, id: project.id };
  }
  const drin: Actor = { id: "user-drin", role: "ORGANIZER", isDemoPersona: true };

  it("derives stages: proposal, in progress, and a confirmed outcome only with evidence", () => {
    assert.equal(deriveProjectStage({ status: "ACTIVE", startedAt: null, completionEvidence: null }), "proposed");
    assert.equal(deriveProjectStage({ status: "ACTIVE", startedAt: new Date(), completionEvidence: null }), "in_progress");
    assert.equal(deriveProjectStage({ status: "COMPLETED", startedAt: new Date(), completionEvidence: "Photo set" }), "completed_confirmed");
    assert.equal(deriveProjectStage({ status: "COMPLETED", startedAt: new Date(), completionEvidence: "  " }), "completed_unconfirmed");
    assert.equal(deriveProjectStage({ status: "COMPLETED", startedAt: null, completionEvidence: null }), "completed_unconfirmed");
  });

  it("moves a new project from proposal to progress to a confirmed outcome, step by step", async () => {
    const { slug, id } = await newProject();
    assert.equal((await getProjectBySlug(slug))?.stage, "proposed");
    assert.equal((await getProjectBySlug(slug))?.responsibleOrganizerName !== null, true);

    await planProject(drin, id, { scheduledFor: new Date(Date.now() + 86_400_000), skillsNeeded: "Gardening", materialsNeeded: "Gloves, bags" });
    await assert.rejects(() => completeProject(drin, id, { note: "Done", evidence: "Photos" }), /not allowed/);
    await startProject(drin, id);
    await assert.rejects(() => startProject(drin, id), /not allowed/);
    await addProjectUpdate(drin, id, "Cleared the first bed.");
    assert.equal((await getProjectBySlug(slug))?.stage, "in_progress");
    assert.equal((await getProjectBySlug(slug))?.updates.length, 1);

    await assert.rejects(() => completeProject(drin, id, { note: "Done", evidence: "  " }), /Evidence is required/);
    await assert.rejects(() => completeProject(drin, id, { note: "Done", evidence: "javascript:alert(1)" }), /valid http/);
    await completeProject(drin, id, { note: "Park cleaned.", evidence: "https://example.org/photos" });
    const done = await getProjectBySlug(slug);
    assert.equal(done?.stage, "completed_confirmed");
    assert.equal(done?.completionEvidence, "https://example.org/photos");
    await assert.rejects(() => addProjectUpdate(drin, id, "Late note"), /already completed/);
  });

  it("only lets the project's organizers manage it", async () => {
    const { slug, id } = await newProject();
    const stranger = await makeActor("MEMBER");
    const otherOrganizer = await makeActor("ORGANIZER");
    await assert.rejects(() => startProject(stranger, id), PermissionError);
    await assert.rejects(() => addProjectUpdate(otherOrganizer, id, "Hello"), PermissionError);
    assert.equal((await getProjectBySlug(slug, stranger.id))?.canManage, false);
    assert.equal((await getProjectBySlug(slug, "user-drin"))?.canManage, true);
    assert.equal((await getProjectBySlug(slug, "user-elmedina"))?.canManage, true);
  });

  it("requires a named responsible organizer before work can start, and names only organizers", async () => {
    const { id } = await newProject();
    const member = await makeActor("MEMBER");
    await assert.rejects(() => planProject(drin, id, { responsibleOrganizerId: member.id }), /must be an organizer/);
    await planProject(drin, id, { responsibleOrganizerId: null });
    await assert.rejects(() => startProject(drin, id), /responsible organizer first/);
  });
});

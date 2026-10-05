import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CATALOG } from "@/lib/i18n/catalog";
import { LOCALES } from "@/lib/i18n/config";
import { makeI18n } from "@/lib/i18n/make";
import { interpolate } from "@/lib/i18n/translate";
import { DEMO_FRIENDS, SEEDED_CONVERSATIONS, VISITOR_STARTER_CONVERSATIONS, VISITOR_STARTER_INVITE } from "@/lib/demo-social";
import { ACTIVITIES } from "@/lib/demo-data";
import { TEXT_TRANSLATIONS } from "@/lib/i18n/content/texts";
import { localizeActivity, localizeText } from "@/lib/i18n/content";
import { localizeReason, localizeNotification } from "@/lib/i18n/reasons";
import { localizeBridgeText, localizeBridgeReasons } from "@/lib/i18n/bridge-text";
import { prisma } from "@/lib/prisma";
import { respondToChat } from "@/lib/assistant/conversation";
import { createDemoVisitor } from "@/lib/data/demo-session";

const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",");

describe("language support is exactly Albanian and English", () => {
  it("offers no other language", () => {
    assert.deepEqual([...LOCALES], ["sq", "en"]);
    for (const entry of Object.values(CATALOG)) assert.deepEqual(Object.keys(entry).sort(), ["en", "sq"]);
  });

  it("every message is filled in both languages and uses the same placeholders", () => {
    for (const [key, entry] of Object.entries(CATALOG)) {
      assert.ok(entry.en.trim() && entry.sq.trim(), `${key} is empty in a language`);
      assert.equal(placeholders(entry.en), placeholders(entry.sq), `${key}: placeholders differ`);
    }
  });

  it("long Albanian messages are really translated, not copies of the English", () => {
    for (const [key, entry] of Object.entries(CATALOG)) {
      if (key.startsWith("meta.title") || key.startsWith("brand.")) continue; // brand name
      if (entry.en.replace(/\{\w+\}/g, "").replace(/[^A-Za-z]/g, "").length === 0) continue; // only placeholders and punctuation
      if (entry.en.length > 24) assert.notEqual(entry.en, entry.sq, `${key}: Albanian equals English`);
    }
  });

  it("plural keys exist as a complete one/other pair", () => {
    const keys = Object.keys(CATALOG);
    for (const key of keys.filter((k) => k.endsWith(".one"))) assert.ok(keys.includes(key.replace(/\.one$/, ".other")), `${key} lacks .other`);
    for (const key of keys.filter((k) => k.endsWith(".other"))) assert.ok(keys.includes(key.replace(/\.other$/, ".one")), `${key} lacks .one`);
  });

  it("a missing key never renders as a raw key", () => {
    const { t } = makeI18n("sq");
    assert.equal(t("does.not.exist"), "–");
    assert.equal(t("home.title.line1"), "Gjej diçka për të bërë.");
    assert.equal(makeI18n("en").t("fact.spotsLeft", { n: 1 }), "1 spot left");
    assert.equal(makeI18n("sq").t("fact.spotsLeft", { n: 3 }), "3 vende të lira");
  });

  it("interpolation only fills {name} placeholders", () => {
    assert.equal(interpolate("Hi {name}", { name: "<b>x</b>" }), "Hi <b>x</b>"); // React escapes it when rendered
    assert.equal(interpolate("Hi {missing}", {}), "Hi {missing}");
  });

  it("dates come from fixed name tables in both languages", () => {
    const sq = makeI18n("sq");
    const en = makeI18n("en");
    assert.equal(sq.shortDate("2036-06-21"), "sht 21 qer");
    assert.equal(en.shortDate("2036-06-21"), "Sat 21 Jun");
    assert.equal(sq.longDate("2036-06-16"), "e hënë, 16 qershor 2036");
    assert.equal(en.longDate("2036-06-16"), "Monday 16 June 2036");
  });
});

describe("seeded content is available in Albanian", () => {
  it("every seeded friend bio, conversation line, invitation and price has an Albanian text", () => {
    const strings = [
      ...DEMO_FRIENDS.map((f) => f.bio),
      ...SEEDED_CONVERSATIONS.map((m) => m.body),
      ...VISITOR_STARTER_CONVERSATIONS.map((m) => m.body),
      VISITOR_STARTER_INVITE.message,
      ...ACTIVITIES.flatMap((a) => (a.costDetail ? [a.costDetail] : [])),
    ];
    for (const s of strings) assert.ok(TEXT_TRANSLATIONS[s]?.sq, `missing Albanian for: ${s}`);
  });

  it("every seeded need, community rule, project and invitation in the database has an Albanian text", async () => {
    const needOwners = ["user-fatlume", "user-blerta", "user-besnik", "user-vlora"];
    for (const n of await prisma.communityNeed.findMany({ where: { submittedById: { in: needOwners } } })) {
      assert.ok(TEXT_TRANSLATIONS[n.description]?.sq, `missing Albanian need: ${n.description}`);
    }
    const communities = ["prishtina-ai-klub", "gjelber-per-prishtinen", "rinia-basketboll-lakrishte", "kolektivi-kulturor-prizreni-i-vjeter", "prishtina-bicikleta", "kuzhina-e-perbashket", "rrethi-i-librit"];
    for (const c of await prisma.community.findMany({ where: { slug: { in: communities } } })) {
      if (c.rules && !/for tests/.test(c.rules)) assert.ok(TEXT_TRANSLATIONS[c.rules]?.sq, `missing Albanian rules: ${c.rules}`);
    }
    const projects = ["kujdesi-per-parkun-dardania", "kurrikula-kodimi-per-te-rinj", "collaboration-prishtina-ai-klub-gjelber-per-prishtinen"];
    for (const p of await prisma.project.findMany({ where: { slug: { in: projects } } })) {
      assert.ok(TEXT_TRANSLATIONS[p.title]?.sq, `missing Albanian project title: ${p.title}`);
      assert.ok(TEXT_TRANSLATIONS[p.description]?.sq, `missing Albanian project text: ${p.description}`);
    }
    for (const i of await prisma.activityInvite.findMany({ where: { isSeededExample: true, from: { isDemoVisitor: false } } })) {
      if (i.message) assert.ok(TEXT_TRANSLATIONS[i.message]?.sq, `missing Albanian invite: ${i.message}`);
    }
  });

  it("activities show Albanian in Albanian and English in English, with visitor text untouched", () => {
    for (const a of ACTIVITIES) {
      const sq = localizeActivity(a, "sq");
      const en = localizeActivity(a, "en");
      assert.equal(sq.title, a.titleSq);
      assert.equal(en.title, a.title);
      assert.notEqual(sq.description, en.description);
    }
    assert.equal(localizeText("Be kind to beginners in either language.", "sq"), "Sillu me mirësi me fillestarët në të dyja gjuhët.");
    assert.equal(localizeText("A visitor wrote this themselves", "sq"), "A visitor wrote this themselves");
  });

  it("generated sentences (match reasons, simulated replies, notifications, BRIDGE text) translate", () => {
    const { t } = makeI18n("sq");
    assert.match(localizeReason("Shares your interest in Photography, Technology", t, "sq"), /Fotografi, Teknologji/);
    assert.match(localizeReason("Both members of Prishtina AI Klub", t, "sq"), /anëtarë/);
    assert.match(localizeReason("Simulated reply: free on weekends and interested in photography.", t, "sq"), /Përgjigje e simuluar/);
    assert.match(localizeNotification("You're going to \"Golden Hour Photography Walk\" — RSVP confirmed.", t, "sq"), /Shëtitje Fotografike/);
    const generated =
      "Prishtina AI Klub brings technology expertise; Gjelbër për Prishtinën brings environment reach in Prishtinë — Dardania. Together they can directly address: \"Neighbors have asked for a second monthly clean-up session so more people can help look after the Dardania green space.\"";
    assert.match(localizeBridgeText(generated, t, "sq"), /sjell ekspertizë/);
    assert.equal(localizeBridgeReasons("Both can act locally in Prishtinë — Dardania; Complementary categories (technology + environment)", t, "sq").length, 2);
    assert.match(
      localizeBridgeText("A shared venue in Prishtinë — Dardania, volunteer time from both communities, and coordination between Drin Gashi (Prishtina AI Klub) and Fatlume Berisha (Gjelbër për Prishtinën).", t, "sq"),
      /Një vend i përbashkët/
    );
  });
});

describe("assistant answers in the visitor's language", () => {
  it("Albanian questions get Albanian replies with the same hard constraints", async () => {
    const v = await createDemoVisitor();
    const sq = makeI18n("sq");
    const r1 = await respondToChat({
      messages: [{ role: "user", content: "Gjej një aktivitet falas të qasshëm në Dardania këtë fundjavë" }],
      state: { shownSlugs: [] },
      viewerId: v.id,
      aiAllowed: false,
      locale: "sq",
    });
    assert.match(r1.text, /Ja çfarë gjeta/);
    assert.match(r1.text, /falas/);
    const cards = r1.cards.filter((c) => c.kind === "activity");
    assert.ok(cards.length > 0, r1.text);
    for (const c of cards) {
      assert.equal(c.kind === "activity" && c.area, "Dardania");
      assert.match(c.kind === "activity" ? c.when : "", /qershor/);
    }

    const greet = await respondToChat({ messages: [{ role: "user", content: "Përshëndetje" }], state: { shownSlugs: [] }, viewerId: v.id, aiAllowed: false, locale: "sq" });
    assert.match(greet.text, /ndihmësi demo/);
    const plans = await respondToChat({ messages: [{ role: "user", content: sq.t("assistant.s.plans") }], state: { shownSlugs: [] }, viewerId: v.id, aiAllowed: false, locale: "sq" });
    assert.match(plans.text, /plan/i);
    const bridge = await respondToChat({ messages: [{ role: "user", content: sq.t("assistant.s.bridge") }], state: { shownSlugs: [] }, viewerId: v.id, aiAllowed: false, locale: "sq" });
    assert.ok(bridge.cards.some((c) => c.kind === "bridge"), bridge.text);
    assert.match(bridge.text, /po punojnë bashkë/);
  });
});

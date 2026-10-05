"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatCard, ChatReply, ChatState } from "@/lib/assistant/conversation";
import { rsvpAction } from "@/lib/actions/activity-actions";
import { addFriendAction, sendInviteAction } from "@/lib/actions/social-actions";
import { joinProjectAction } from "@/lib/actions/project-actions";
import { demoLoginAction } from "@/lib/auth/actions";
import { buttonClass, Pill } from "@/components/ui";
import { useI18n } from "@/components/LocaleProvider";

interface Entry {
  id: number;
  role: "user" | "assistant";
  content: string;
  cards?: ChatCard[];
  source?: "rules" | "ai";
  notice?: string;
  error?: boolean;
}

const STORAGE_KEY = "hn-assistant-v1";

function CardView({ card }: { card: ChatCard }) {
  const { t } = useI18n();
  if (card.kind === "login") {
    return (
      <form action={demoLoginAction}>
        <button type="submit" className={buttonClass("accent", "sm")}>
          {t("action.demoLogin")}
        </button>
      </form>
    );
  }
  if (card.kind === "activity") {
    return (
      <div className="flex flex-col gap-2 rounded-xl border border-border bg-background p-3 text-sm">
        <div>
          <Link href={`/discover/${card.slug}`} className="font-display text-base font-semibold text-foreground hover:underline">
            {card.title}
          </Link>
          <p className="text-xs text-foreground-muted">
            📅 {card.when} · 📍 {card.area} · {t("assistant.spots", { n: card.spotsLeft })}
          </p>
        </div>
        {card.reasons.length > 0 && (
          <ul className="flex flex-wrap gap-1.5">
            {card.reasons.map((r) => (
              <li key={r}>
                <Pill tone="brand">{r}</Pill>
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-wrap gap-2">
          <Link href={`/discover/${card.slug}`} className={buttonClass("secondary", "sm")}>
            {t("action.viewActivity")}
          </Link>
          {card.canAct &&
            (card.alreadyGoing ? (
              <Link href="/plans" className={buttonClass("ghost", "sm")}>
                {t("assistant.going")} · {t("assistant.plansLink")}
              </Link>
            ) : (
              <form action={rsvpAction}>
                <input type="hidden" name="activityId" value={card.activityId} />
                <button type="submit" className={buttonClass("primary", "sm")}>
                  {t("action.rsvp")}
                </button>
              </form>
            ))}
          {card.invite &&
            (card.invite.alreadyInvited ? (
              <Pill tone="success">{t("assistant.alreadyInvited")}</Pill>
            ) : (
              <form action={sendInviteAction}>
                <input type="hidden" name="friendId" value={card.invite.friendId} />
                <input type="hidden" name="activityId" value={card.activityId} />
                <input type="hidden" name="message" value={t("friends.inviteDefault", { title: card.title })} />
                <input type="hidden" name="returnTo" value="/plans" />
                <button type="submit" className={buttonClass("accent", "sm")}>
                  {t("action.invite", { name: card.invite.friendName.split(" ")[0] })}
                </button>
              </form>
            ))}
        </div>
      </div>
    );
  }
  if (card.kind === "friend") {
    return (
      <div className="flex flex-col gap-2 rounded-xl border border-border bg-background p-3 text-sm">
        <div>
          <p className="font-display text-base font-semibold text-foreground">
            {card.name} <Pill tone="accent">{t("friends.demoFriend")}</Pill>
          </p>
          {card.area && <p className="text-xs text-foreground-muted">{card.area}</p>}
          {card.reasons.length > 0 && <p className="text-xs text-brand-strong">{card.reasons.join(" · ")}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/people/${card.id}`} className={buttonClass("secondary", "sm")}>
            {t("assistant.viewProfile")}
          </Link>
          {!card.isFriend && (
            <form action={addFriendAction}>
              <input type="hidden" name="friendId" value={card.id} />
              <input type="hidden" name="returnTo" value={`/people/${card.id}`} />
              <button type="submit" className={buttonClass("primary", "sm")}>
                {t("action.addFriend")}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }
  if (card.kind === "bridge") {
    return (
      <div className="flex flex-col gap-2 rounded-xl border border-border bg-background p-3 text-sm">
        <p className="font-display text-base font-semibold text-foreground">{card.title}</p>
        <p className="text-xs text-foreground-muted">{card.stage}</p>
        <div className="flex flex-wrap gap-2">
          <Link href={`/bridge/${card.id}`} className={buttonClass("secondary", "sm")}>
            {t("assistant.openBridge")}
          </Link>
          {card.canJoin && card.projectId && (
            <form action={joinProjectAction}>
              <input type="hidden" name="projectId" value={card.projectId} />
              <button type="submit" className={buttonClass("primary", "sm")}>
                {t("assistant.joinProject")}
              </button>
            </form>
          )}
          {card.alreadyJoined && <Pill tone="success">{t("assistant.joined")}</Pill>}
          <Link href={card.nextHref} className={buttonClass("ghost", "sm")}>
            {card.nextLabel}
          </Link>
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-border bg-background p-3 text-sm">
      <Link href={`/discover/${card.slug}`} className="font-display text-base font-semibold text-foreground hover:underline">
        {card.title}
      </Link>
      <p className="text-xs text-foreground-muted">{card.when}</p>
      <p className="text-xs text-foreground-muted">{card.note}</p>
      <Link href="/plans" className={buttonClass("secondary", "sm", "w-fit")}>
        {t("assistant.plansLink")}
      </Link>
    </div>
  );
}

export function AssistantChat({
  signedIn,
  aiConfigured,
  initialQuestion,
}: {
  signedIn: boolean;
  aiConfigured: boolean;
  initialQuestion?: string;
}) {
  const { t } = useI18n();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [state, setState] = useState<ChatState>({ shownSlugs: [] });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const idRef = useRef(1);
  const endRef = useRef<HTMLDivElement | null>(null);
  const restored = useRef(false);

  // Restore the conversation after a round trip to an activity page (sessionStorage only; never sent anywhere).
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as { entries: Entry[]; state: ChatState };
        if (Array.isArray(saved.entries) && saved.entries.length > 0) {
          // Restoring from an external store (sessionStorage) once after mount is the correct sync point;
          // reading it during render would mismatch the server-rendered HTML.
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setEntries(saved.entries);
          setState(saved.state ?? { shownSlugs: [] });
          idRef.current = Math.max(...saved.entries.map((e) => e.id)) + 1;
        }
      }
    } catch {
      /* storage unavailable — start fresh */
    }
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ entries, state }));
    } catch {
      /* ignore */
    }
    endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [entries, state]);

  const send = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || loading) return;
      const userEntry: Entry = { id: idRef.current++, role: "user", content };
      setEntries((prev) => [...prev, userEntry]);
      setInput("");
      setLoading(true);
      try {
        const history = [...entries, userEntry].slice(-10).map((e) => ({ role: e.role, content: e.content }));
        const res = await fetch("/api/assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history, state }),
        });
        const json = (await res.json()) as { reply?: ChatReply; error?: string };
        if (!res.ok || !json.reply) {
          setEntries((prev) => [...prev, { id: idRef.current++, role: "assistant", content: json.error ?? t("assistant.errGeneric"), error: true }]);
        } else {
          const reply = json.reply;
          setState(reply.state);
          setEntries((prev) => [
            ...prev,
            { id: idRef.current++, role: "assistant", content: reply.text, cards: reply.cards, source: reply.source, notice: reply.notice },
          ]);
        }
      } catch {
        setEntries((prev) => [...prev, { id: idRef.current++, role: "assistant", content: t("assistant.errServer"), error: true }]);
      } finally {
        setLoading(false);
      }
    },
    [entries, loading, state, t]
  );

  const askedInitial = useRef(false);
  useEffect(() => {
    if (initialQuestion && !askedInitial.current) {
      askedInitial.current = true;
      void send(initialQuestion);
    }
  }, [initialQuestion, send]);

  const last = [...entries].reverse().find((e) => e.role === "assistant");
  const start = [t("assistant.s.weekend"), t("assistant.s.withFriend", { name: "Arta" }), t("assistant.s.bridge"), t("assistant.s.plans")];
  const suggestions = entries.length === 0 ? start : last?.cards?.length ? [t("assistant.s.another"), ...start.slice(0, 2)] : start.slice(0, 3);

  return (
    <div className="flex flex-col gap-4">
      <div
        className="flex min-h-[320px] flex-col gap-4 rounded-2xl border border-border bg-surface p-4 sm:p-5"
        role="log"
        aria-live="polite"
        aria-label={t("assistant.conversation")}
      >
        {entries.length === 0 && (
          <div className="flex flex-col gap-2 rounded-xl bg-brand-tint p-4 text-sm text-brand-strong">
            <p className="font-display text-lg font-semibold">{t("assistant.hello")}</p>
            <p>{signedIn ? t("assistant.introSignedIn") : t("assistant.intro")}</p>
          </div>
        )}
        {entries.map((e) => (
          <div key={e.id} className={`flex flex-col gap-2 ${e.role === "user" ? "items-end" : "items-start"}`}>
            <span className="text-[11px] font-medium text-foreground-muted">{e.role === "user" ? t("messages.you") : t("nav.assistant")}</span>
            <div
              className={`max-w-[92%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-sm ${
                e.role === "user"
                  ? "rounded-br-md bg-brand text-white"
                  : e.error
                    ? "rounded-bl-md border border-danger bg-danger-tint text-danger"
                    : "rounded-bl-md bg-surface-muted text-foreground"
              }`}
            >
              {e.content}
            </div>
            {e.role === "assistant" && !e.error && (
              <p className="text-[11px] text-foreground-muted">
                {e.source === "ai" ? t("assistant.sourceAi") : t("assistant.sourceRules")}
              </p>
            )}
            {e.notice && <p className="max-w-[92%] text-xs text-danger">{e.notice}</p>}
            {e.cards && e.cards.length > 0 && (
              <div className="flex w-full max-w-[92%] flex-col gap-2">
                {e.cards.map((c, i) => (
                  <CardView key={i} card={c} />
                ))}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <p className="text-sm text-foreground-muted" role="status">
            {t("assistant.thinking")}
          </p>
        )}
        <div ref={endRef} />
      </div>

      <div className="flex flex-wrap gap-2" aria-label={t("assistant.suggestions")}>
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => void send(s)}
            disabled={loading}
            className="rounded-full border border-border bg-surface px-3 py-1.5 text-sm text-foreground-muted hover:bg-surface-muted disabled:opacity-50"
          >
            {s}
          </button>
        ))}
      </div>

      <form
        onSubmit={(ev) => {
          ev.preventDefault();
          void send(input);
        }}
        className="flex gap-2"
      >
        <label htmlFor="assistant-input" className="sr-only">
          {t("assistant.label")}
        </label>
        <input
          id="assistant-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={500}
          placeholder={t("assistant.placeholder")}
          className="flex-1 rounded-full border border-border bg-background px-4 py-3 text-sm"
          autoComplete="off"
        />
        <button type="submit" disabled={loading || !input.trim()} className={buttonClass("primary", "md", "disabled:opacity-50")}>
          {t("assistant.send")}
        </button>
      </form>
      <p className="text-xs text-foreground-muted">
        {aiConfigured ? t("assistant.footerAi") : t("assistant.footerRules")}
      </p>
    </div>
  );
}

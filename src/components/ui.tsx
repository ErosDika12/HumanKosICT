import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

/** Small shared UI vocabulary so every screen looks like one product. */

type Variant = "primary" | "secondary" | "accent" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANT: Record<Variant, string> = {
  primary: "bg-brand text-white hover:bg-brand-strong border border-transparent",
  secondary: "bg-surface text-foreground border border-border hover:bg-surface-muted",
  accent: "bg-accent text-[#1c1b1a] hover:brightness-95 border border-transparent",
  ghost: "text-brand-strong hover:bg-brand-tint border border-transparent",
  danger: "text-danger border border-danger hover:bg-danger-tint bg-transparent",
};
const SIZE: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2.5 text-sm",
  lg: "px-6 py-3.5 text-base",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra = ""): string {
  return `inline-flex items-center justify-center gap-2 rounded-full text-center font-semibold transition-colors ${VARIANT[variant]} ${SIZE[size]} ${extra}`;
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: { variant?: Variant; size?: Size } & ComponentProps<typeof Link>) {
  return <Link {...props} className={buttonClass(variant, size, className)} />;
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  type = "submit",
  ...props
}: { variant?: Variant; size?: Size } & ComponentProps<"button">) {
  return <button type={type} {...props} className={buttonClass(variant, size, className)} />;
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-border bg-surface shadow-sm ${className}`}>{children}</div>;
}

export function Pill({
  children,
  tone = "neutral",
  className = "",
}: {
  children: ReactNode;
  tone?: "neutral" | "brand" | "success" | "accent" | "danger";
  className?: string;
}) {
  const tones = {
    neutral: "bg-surface-muted text-foreground-muted",
    brand: "bg-brand-tint text-brand-strong",
    success: "bg-success-tint text-success",
    accent: "bg-accent-tint text-accent-strong",
    danger: "bg-danger-tint text-danger",
  } as const;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${tones[tone]} ${className}`}>
      {children}
    </span>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-strong">{children}</p>;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="flex max-w-2xl flex-col gap-1.5">
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{title}</h2>
        {description && <p className="text-sm text-foreground-muted sm:text-base">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageShell({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10 ${className}`}>{children}</div>;
}

/** Inline result banner driven by ?ok= / ?error= on the page URL. */
export function Notice({ kind, children }: { kind: "ok" | "error" | "info"; children: ReactNode }) {
  const styles = {
    ok: "border-success bg-success-tint text-success",
    error: "border-danger bg-danger-tint text-danger",
    info: "border-brand bg-brand-tint text-brand-strong",
  } as const;
  return (
    <div role={kind === "error" ? "alert" : "status"} className={`rounded-xl border px-4 py-3 text-sm font-medium ${styles[kind]}`}>
      {children}
    </div>
  );
}

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-surface-muted px-6 py-10 text-center">
      <p className="font-display text-lg font-semibold text-foreground">{title}</p>
      {children && <div className="max-w-md text-sm text-foreground-muted">{children}</div>}
      {action}
    </div>
  );
}

/** Two-letter avatar — no photographs of fictional people are ever used. */
export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-brand-tint font-display font-semibold text-brand-strong"
    >
      {initials}
    </span>
  );
}

/** Short reminder, used wherever a fictional friend's status is shown. */
export function DemoFriendNote() {
  return (
    <p className="text-xs text-foreground-muted">
      Demo friends are fictional. They never reply live — statuses labeled &quot;simulated&quot; come from a transparent
      availability rule, and conversation lines labeled &quot;demo example&quot; are seeded.
    </p>
  );
}

export function readFlash(params: { ok?: string; error?: string }, messages: Record<string, string>) {
  return {
    ok: params.ok ? messages[params.ok] ?? null : null,
    error: params.error ?? null,
  };
}

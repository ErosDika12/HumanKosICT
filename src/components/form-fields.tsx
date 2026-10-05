import type { ReactNode } from "react";

export const inputClass = "rounded-lg border border-border bg-background px-3 py-2 text-base text-foreground";

export function Field({
  label,
  name,
  defaultValue,
  required,
  placeholder,
  type = "text",
  step,
  min,
}: {
  label: string;
  name: string;
  defaultValue?: string | number;
  required?: boolean;
  placeholder?: string;
  type?: string;
  step?: string;
  min?: number;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-foreground">{label}</span>
      <input type={type} name={name} defaultValue={defaultValue} required={required} placeholder={placeholder} step={step} min={min} className={inputClass} />
    </label>
  );
}

export function TextArea({ label, name, required, defaultValue, rows = 3 }: { label: string; name: string; required?: boolean; defaultValue?: string; rows?: number }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-foreground">{label}</span>
      <textarea name={name} required={required} defaultValue={defaultValue} rows={rows} className={inputClass} />
    </label>
  );
}

export function SelectField({ label, name, defaultValue, children }: { label: string; name: string; defaultValue?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-foreground">{label}</span>
      <select name={name} defaultValue={defaultValue} className={inputClass}>
        {children}
      </select>
    </label>
  );
}

export function SubmitButton({ children }: { children: ReactNode }) {
  return (
    <button type="submit" className="inline-flex min-h-10 w-fit items-center justify-center rounded-full bg-brand px-6 py-2 text-sm font-semibold text-white hover:bg-brand-strong">
      {children}
    </button>
  );
}

export function FormCard({ action, children }: { action: (formData: FormData) => Promise<void>; children: ReactNode }) {
  return (
    <form action={action} className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5">
      {children}
    </form>
  );
}

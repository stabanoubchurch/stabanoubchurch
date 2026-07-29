import type { ReactNode } from "react";

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="font-semibold text-primary">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

export const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-gold";

export function PrimaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { className = "", ...rest } = props;
  return (
    <button
      {...rest}
      className={`inline-flex items-center rounded-md bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-slate disabled:opacity-60 ${className}`}
    />
  );
}

export function GhostButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { className = "", ...rest } = props;
  return (
    <button
      {...rest}
      className={`inline-flex items-center rounded-md border border-border px-3 py-2 text-sm font-semibold text-primary transition-colors hover:bg-secondary disabled:opacity-60 ${className}`}
    />
  );
}

export function Card({ children }: { children: ReactNode }) {
  return <div className="rounded-lg border border-border bg-card p-5">{children}</div>;
}
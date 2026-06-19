import type { ReactNode } from "react";

const fmt = (s: string | number | null | undefined) => {
  if (s === null || s === undefined) return "—";
  const n = Number(s);
  if (Number.isNaN(n)) return String(s);
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
};

export function Card({
  title,
  subtitle,
  accent = "slate",
  children,
}: {
  title: string;
  subtitle?: string;
  accent?: "slate" | "emerald" | "sky" | "violet";
  children: ReactNode;
}) {
  const ring = {
    slate: "ring-slate-700/60",
    emerald: "ring-emerald-700/50",
    sky: "ring-sky-700/50",
    violet: "ring-violet-700/50",
  }[accent];
  const dot = {
    slate: "bg-slate-400",
    emerald: "bg-emerald-400",
    sky: "bg-sky-400",
    violet: "bg-violet-400",
  }[accent];
  return (
    <section className={`flex flex-col rounded-2xl bg-slate-900/70 ring-1 ${ring} backdrop-blur`}>
      <header className="flex items-center gap-2 border-b border-slate-800 px-5 py-3.5">
        <span className={`h-2 w-2 rounded-full ${dot}`} />
        <h2 className="text-sm font-semibold tracking-tight text-slate-100">{title}</h2>
        {subtitle && <span className="ml-auto text-[11px] font-medium text-slate-500">{subtitle}</span>}
      </header>
      <div className="flex flex-1 flex-col gap-4 p-5">{children}</div>
    </section>
  );
}

export function MoneyGauge({
  remaining,
  total,
}: {
  remaining: number;
  total: number;
}) {
  const pct = total > 0 ? Math.max(0, Math.min(100, (remaining / total) * 100)) : 0;
  const spent = Math.max(0, total - remaining);
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="font-mono text-2xl font-semibold text-emerald-300">${fmt(remaining)}</span>
        <span className="text-xs text-slate-500">of ${fmt(total)} remaining</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-1 text-right text-[11px] text-slate-500">${fmt(spent)} committed</div>
    </div>
  );
}

export function Stat({ label, value, mono }: { label: string; value: ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-400">{label}</span>
      <span className={`${mono ? "font-mono" : ""} font-medium text-slate-200`}>{value}</span>
    </div>
  );
}

export function Chip({ children, tone = "slate" }: { children: ReactNode; tone?: "slate" | "emerald" | "amber" | "red" }) {
  const cls = {
    slate: "bg-slate-800 text-slate-300 ring-slate-700",
    emerald: "bg-emerald-500/10 text-emerald-300 ring-emerald-600/40",
    amber: "bg-amber-500/10 text-amber-300 ring-amber-600/40",
    red: "bg-red-500/10 text-red-300 ring-red-600/40",
  }[tone];
  return <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ${cls}`}>{children}</span>;
}

export function Button({
  children,
  onClick,
  variant = "ghost",
  disabled,
}: {
  children: ReactNode;
  onClick: () => void;
  variant?: "primary" | "ghost" | "danger" | "warn";
  disabled?: boolean;
}) {
  const cls = {
    primary: "bg-emerald-500 text-emerald-950 hover:bg-emerald-400",
    ghost: "bg-slate-800 text-slate-200 hover:bg-slate-700",
    danger: "bg-red-500/90 text-white hover:bg-red-500",
    warn: "bg-amber-500/90 text-amber-950 hover:bg-amber-400",
  }[variant];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${cls}`}
    >
      {children}
    </button>
  );
}

export const money = fmt;

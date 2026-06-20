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
  const dot = {
    slate: "bg-neutral-400",
    emerald: "bg-emerald-500",
    sky: "bg-sky-500",
    violet: "bg-violet-500",
  }[accent];
  return (
    <section className="flex flex-col rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <header className="flex items-center gap-2 border-b border-neutral-100 px-5 py-3.5">
        <span className={`h-2 w-2 rounded-full ${dot}`} />
        <h2 className="text-sm font-semibold tracking-tight text-neutral-900">{title}</h2>
        {subtitle && <span className="ml-auto text-[11px] font-medium text-neutral-400">{subtitle}</span>}
      </header>
      <div className="flex flex-1 flex-col gap-4 p-5">{children}</div>
    </section>
  );
}

export function MoneyGauge({ remaining, total }: { remaining: number; total: number }) {
  const pct = total > 0 ? Math.max(0, Math.min(100, (remaining / total) * 100)) : 0;
  const spent = Math.max(0, total - remaining);
  const spentPct = total > 0 ? (spent / total) * 100 : 0;
  // Threshold coloring: healthy headroom -> amber -> nearly exhausted.
  const fill =
    spentPct > 85
      ? "from-red-500 to-red-400"
      : spentPct > 70
        ? "from-amber-500 to-amber-400"
        : "from-emerald-500 to-emerald-400";
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="font-mono text-2xl font-semibold text-neutral-900">${fmt(remaining)}</span>
        <span className="text-xs text-neutral-400">of ${fmt(total)} remaining</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-neutral-200">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${fill} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-neutral-400">
        <span>{spentPct.toFixed(0)}% utilized</span>
        <span>${fmt(spent)} committed</span>
      </div>
    </div>
  );
}

export function Stat({ label, value, mono }: { label: string; value: ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-neutral-500">{label}</span>
      <span className={`${mono ? "font-mono" : ""} font-medium text-neutral-900`}>{value}</span>
    </div>
  );
}

export function Chip({ children, tone = "slate" }: { children: ReactNode; tone?: "slate" | "emerald" | "amber" | "red" }) {
  const cls = {
    slate: "bg-neutral-100 text-neutral-700 ring-neutral-200",
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    amber: "bg-amber-50 text-amber-700 ring-amber-200",
    red: "bg-red-50 text-red-700 ring-red-200",
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
    primary: "bg-emerald-600 text-white hover:bg-emerald-500",
    ghost: "border border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50",
    danger: "bg-red-600 text-white hover:bg-red-500",
    warn: "bg-amber-500 text-white hover:bg-amber-400",
  }[variant];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg px-3 py-2 text-xs font-semibold shadow-sm transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 ${cls}`}
    >
      {children}
    </button>
  );
}

export const money = fmt;

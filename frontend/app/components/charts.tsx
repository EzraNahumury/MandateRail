import type { AuditEntry } from "@/app/lib/types";
import { money } from "./ui";

// All charts are hand-rolled SVG — zero charting deps, same spirit as MoneyGauge.
// Everything is derived live from the on-chain audit trail (the regulator's view),
// so the analytics are a projection of the ledger, never a separate source of truth.

const asc = (a: AuditEntry, b: AuditEntry) => a.committedAt.localeCompare(b.committedAt);
const hhmmss = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleTimeString("en-US", { hour12: false });
};

function MiniStat({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "neutral" | "amber" }) {
  return (
    <div className="rounded-lg bg-neutral-50 px-3 py-2 ring-1 ring-neutral-200">
      <div className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">{label}</div>
      <div className={`mt-0.5 font-mono text-base font-semibold ${tone === "amber" ? "text-amber-600" : "text-neutral-900"}`}>
        {value}
      </div>
    </div>
  );
}

// Budget burndown — remaining budget after each commit, in commit order.
function Burndown({ trail, original }: { trail: AuditEntry[]; original: number }) {
  const W = 320;
  const H = 110;
  const padL = 6;
  const padR = 6;
  const padT = 8;
  const padB = 8;
  const top = original > 0 ? original : 1;

  // points: start at full budget, then remaining after each successive commit.
  const remainings = trail.reduce<number[]>(
    (acc, a) => [...acc, acc[acc.length - 1] - Number(a.amount)],
    [original],
  );
  const n = remainings.length;
  const x = (i: number) => padL + (n === 1 ? 0 : (i * (W - padL - padR)) / (n - 1));
  const y = (v: number) => padT + (1 - Math.max(0, v) / top) * (H - padT - padB);

  const line = remainings.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const area = `${line} L${x(n - 1).toFixed(1)},${(H - padB).toFixed(1)} L${x(0).toFixed(1)},${(H - padB).toFixed(1)} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-28 w-full">
      <defs>
        <linearGradient id="burn" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(16 185 129)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="rgb(16 185 129)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#burn)" />
      <path d={line} fill="none" stroke="rgb(16 185 129)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      {remainings.map((v, i) => (
        <circle key={i} cx={x(i)} cy={y(v)} r="2.5" fill="white" stroke="rgb(16 185 129)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  );
}

// Per-transaction bars vs the per-tx cap reference line. Over-cap (human-approved)
// bars render amber and break the cap line — visibly the exception path.
function SpendBars({ trail, cap }: { trail: AuditEntry[]; cap: number }) {
  const maxAmt = Math.max(cap, ...trail.map((a) => Number(a.amount)), 1);
  const capPct = (cap / maxAmt) * 100;
  return (
    <div className="relative h-28 w-full">
      {/* per-tx cap reference line */}
      <div className="absolute inset-x-0 z-10 flex items-center gap-1" style={{ bottom: `${capPct}%` }}>
        <div className="h-px flex-1 border-t border-dashed border-sky-400" />
        <span className="rounded bg-sky-50 px-1 py-0.5 text-[9px] font-semibold text-sky-600 ring-1 ring-sky-100">
          cap ${money(cap)}
        </span>
      </div>
      <div className="flex h-full items-end gap-1.5">
        {trail.map((a, i) => {
          const h = (Number(a.amount) / maxAmt) * 100;
          const over = a.humanApproved;
          return (
            <div key={i} className="group relative flex flex-1 flex-col items-center justify-end">
              <div
                className={`w-full rounded-t transition-all duration-500 ${over ? "bg-amber-400" : "bg-violet-400"} group-hover:opacity-80`}
                style={{ height: `${h}%` }}
              />
              <div className="pointer-events-none absolute -top-7 z-20 hidden whitespace-nowrap rounded bg-neutral-900 px-1.5 py-0.5 text-[10px] font-medium text-white group-hover:block">
                ${money(a.amount)}{over ? " · approved" : ""}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Two ledger-derived utilization bars, threshold-colored: how much of the budget
// is consumed, and how close the largest single ticket ran to the per-tx cap.
function UtilBar({ label, pct, detail }: { label: string; pct: number; detail: string }) {
  const clamped = Math.max(0, Math.min(100, pct * 100));
  const fill = clamped > 85 ? "bg-red-500" : clamped > 70 ? "bg-amber-500" : "bg-emerald-500";
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-[11px]">
        <span className="text-neutral-500">{label}</span>
        <span className="font-mono text-neutral-700">{detail}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200">
        <div className={`h-full rounded-full ${fill} transition-all duration-500`} style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}

function LimitUtilization({
  budgetConsumed,
  largestTicket,
  perTxCap,
}: {
  budgetConsumed: number;
  largestTicket: number;
  perTxCap: number;
}) {
  const headroom = perTxCap > 0 ? largestTicket / perTxCap : 0;
  return (
    <div className="mt-4 grid grid-cols-1 gap-3 rounded-lg bg-neutral-50 p-3 ring-1 ring-neutral-200 sm:grid-cols-2">
      <UtilBar label="Budget consumed" pct={budgetConsumed} detail={`${(budgetConsumed * 100).toFixed(0)}%`} />
      <UtilBar
        label="Largest ticket vs per-tx cap"
        pct={headroom}
        detail={`$${money(largestTicket)} / $${money(perTxCap)}`}
      />
    </div>
  );
}

export function SpendAnalytics({
  trail,
  perTxCap,
  remainingBudget,
}: {
  trail: AuditEntry[];
  perTxCap: number;
  remainingBudget: number;
}) {
  const ordered = [...trail].sort(asc);
  const totalCommitted = ordered.reduce((s, a) => s + Number(a.amount), 0);
  const original = remainingBudget + totalCommitted;
  const humanApproved = ordered.filter((a) => a.humanApproved).length;
  const avg = ordered.length ? totalCommitted / ordered.length : 0;

  if (ordered.length === 0) {
    return (
      <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
          <span className="h-2 w-2 rounded-full bg-violet-500" />
          <h2 className="text-sm font-semibold tracking-tight text-neutral-900">Spend Analytics</h2>
          <span className="ml-auto text-[11px] font-medium text-neutral-400">derived from the on-chain audit trail</span>
        </div>
        <p className="pt-5 text-center text-sm text-neutral-400">
          No commits yet — analytics populate live as the Buyer Agent spends.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2 border-b border-neutral-100 pb-3">
        <span className="h-2 w-2 rounded-full bg-violet-500" />
        <h2 className="text-sm font-semibold tracking-tight text-neutral-900">Spend Analytics</h2>
        <span className="ml-auto text-[11px] font-medium text-neutral-400">derived from the on-chain audit trail</span>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MiniStat label="Committed" value={`$${money(totalCommitted)}`} />
        <MiniStat label="Transactions" value={String(ordered.length)} />
        <MiniStat label="Avg ticket" value={`$${money(avg)}`} />
        <MiniStat label="Human-approved" value={String(humanApproved)} tone={humanApproved ? "amber" : "neutral"} />
      </div>

      <LimitUtilization
        budgetConsumed={original > 0 ? totalCommitted / original : 0}
        largestTicket={Math.max(0, ...ordered.map((a) => Number(a.amount)))}
        perTxCap={perTxCap}
      />

      <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <div className="mb-1.5 flex items-baseline justify-between">
            <span className="text-xs font-medium text-neutral-500">Budget burndown</span>
            <span className="font-mono text-[11px] text-neutral-400">${money(remainingBudget)} left of ${money(original)}</span>
          </div>
          <Burndown trail={ordered} original={original} />
        </div>
        <div>
          <div className="mb-1.5 flex items-baseline justify-between">
            <span className="text-xs font-medium text-neutral-500">Per-transaction size vs cap</span>
            <span className="text-[11px] text-neutral-400">
              <span className="inline-block h-2 w-2 rounded-sm bg-violet-400 align-middle" /> in-cap{" "}
              <span className="ml-1 inline-block h-2 w-2 rounded-sm bg-amber-400 align-middle" /> approved
            </span>
          </div>
          <SpendBars trail={ordered} cap={perTxCap} />
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-2 text-xs font-medium text-neutral-500">Commit timeline</div>
        <ol className="relative space-y-3 border-l border-neutral-200 pl-4">
          {[...ordered].reverse().map((a, i) => (
            <li key={i} className="relative">
              <span
                className={`absolute -left-[1.30rem] top-1 h-2.5 w-2.5 rounded-full ring-2 ring-white ${a.humanApproved ? "bg-amber-400" : "bg-violet-400"}`}
              />
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 font-medium text-neutral-800">
                  {a.supplier}
                  {a.humanApproved && (
                    <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-700 ring-1 ring-amber-200">
                      ⤴ human-approved
                    </span>
                  )}
                </span>
                <span className="flex items-center gap-2">
                  <span className="font-mono text-neutral-900">${money(a.amount)}</span>
                  <span className="font-mono text-[10px] text-neutral-400">{hhmmss(a.committedAt)}</span>
                </span>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

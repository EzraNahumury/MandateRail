"use client";

import { useEffect, useRef, useState } from "react";
import type { AuditEntry } from "@/app/lib/types";
import { money } from "./ui";

// Extra hand-rolled SVG/CSS visuals — zero charting deps, same house style as
// charts.tsx. Everything is derived live from the on-chain audit trail + mandate
// snapshot; nothing here is mock data.

const PALETTE = ["#8b5cf6", "#10b981", "#0ea5e9", "#f59e0b", "#f43f5e", "#14b8a6"];

/** Eased count-up for KPI numbers. App-side rAF (fine outside workflow scripts). */
function useCountUp(target: number, duration = 800): number {
  const [val, setVal] = useState(0);
  const fromRef = useRef(0);
  useEffect(() => {
    const start = fromRef.current;
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(start + (target - start) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

export function CountTile({
  label,
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  tone = "neutral",
}: {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  tone?: "neutral" | "violet" | "emerald" | "amber" | "sky";
}) {
  const n = useCountUp(value);
  const toneCls = {
    neutral: "text-neutral-900",
    violet: "text-violet-600",
    emerald: "text-emerald-600",
    amber: "text-amber-600",
    sky: "text-sky-600",
  }[tone];
  const shown = decimals > 0 ? n.toFixed(decimals) : Math.round(n).toLocaleString("en-US");
  return (
    <div className="rounded-xl bg-white px-3.5 py-3 shadow-sm ring-1 ring-neutral-200">
      <div className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">{label}</div>
      <div className={`mt-1 font-mono text-xl font-bold tabular-nums ${toneCls}`}>
        {prefix}
        {shown}
        {suffix}
      </div>
    </div>
  );
}

export interface DonutSlice {
  label: string;
  value: number;
}

/** Spend-share donut. One SVG circle per slice via stroke-dasharray arcs. */
export function SupplierDonut({ slices }: { slices: DonutSlice[] }) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  const R = 52;
  const C = 2 * Math.PI * R;
  type Arc = { label: string; value: number; color: string; len: number; offset: number; frac: number };
  const arcs = slices
    .filter((s) => s.value > 0)
    .reduce<Arc[]>((out, s, i) => {
      const frac = total > 0 ? s.value / total : 0;
      const prev = out.length ? out[out.length - 1] : null;
      const offset = prev ? prev.offset + prev.len : 0;
      return [...out, { label: s.label, value: s.value, color: PALETTE[i % PALETTE.length], len: frac * C, offset, frac }];
    }, []);
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 140 140" className="h-32 w-32 flex-shrink-0 -rotate-90">
        <circle cx="70" cy="70" r={R} fill="none" stroke="#f1f1ef" strokeWidth="14" />
        {arcs.map((a, i) => (
          <circle
            key={i}
            cx="70"
            cy="70"
            r={R}
            fill="none"
            stroke={a.color}
            strokeWidth="14"
            strokeDasharray={`${a.len} ${C - a.len}`}
            strokeDashoffset={-a.offset}
            strokeLinecap="butt"
            style={{ transition: "stroke-dasharray 600ms ease, stroke-dashoffset 600ms ease" }}
          />
        ))}
      </svg>
      <div className="min-w-0 flex-1 space-y-1.5">
        {arcs.length === 0 && <p className="text-sm text-neutral-400">No spend yet.</p>}
        {arcs.map((a, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="h-2.5 w-2.5 flex-shrink-0 rounded-sm" style={{ background: a.color }} />
            <span className="truncate text-neutral-700">{a.label}</span>
            <span className="ml-auto font-mono text-neutral-500">{(a.frac * 100).toFixed(0)}%</span>
            <span className="w-16 text-right font-mono font-medium text-neutral-900">${money(a.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Nested authority limits: charter ceiling ⊇ mandate cap ⊇ largest ticket.
 *  Makes the 3-layer "tighten-only" story visual and live. */
export function AuthorityRibbon({
  ceilingPerTx,
  perTxCap,
  largestTicket,
}: {
  ceilingPerTx: number;
  perTxCap: number;
  largestTicket: number;
}) {
  const top = Math.max(ceilingPerTx, perTxCap, largestTicket, 1);
  const pct = (v: number) => `${Math.max(2, Math.min(100, (v / top) * 100))}%`;
  const rows = [
    { label: "Charter ceiling / tx", v: ceilingPerTx, cls: "bg-sky-200", text: "text-sky-700" },
    { label: "Mandate cap / tx", v: perTxCap, cls: "bg-violet-300", text: "text-violet-700" },
    { label: "Largest committed", v: largestTicket, cls: "bg-emerald-400", text: "text-emerald-700" },
  ];
  return (
    <div className="space-y-2.5">
      {rows.map((r) => (
        <div key={r.label}>
          <div className="mb-1 flex items-baseline justify-between text-[11px]">
            <span className="text-neutral-500">{r.label}</span>
            <span className={`font-mono font-semibold ${r.text}`}>${money(r.v)}</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-neutral-100">
            <div className={`h-full rounded-full ${r.cls} transition-all duration-700`} style={{ width: pct(r.v) }} />
          </div>
        </div>
      ))}
      <p className="pt-0.5 text-[10px] leading-relaxed text-neutral-400">
        Each layer can only <span className="font-semibold text-neutral-500">tighten</span> the one above — enforced by the ledger.
      </p>
    </div>
  );
}

/** Compliance heat-strip: one column per commit, one cell per ledger check.
 *  All-green = every precondition passed, proven on-chain. */
export function ComplianceMatrix({ trail }: { trail: AuditEntry[] }) {
  if (trail.length === 0) return null;
  const ordered = [...trail].sort((a, b) => a.committedAt.localeCompare(b.committedAt));
  const labels = ordered[0].checks.map((c) => c.label);
  return (
    <div className="rounded-lg bg-neutral-50 p-3 ring-1 ring-neutral-200">
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
        Compliance matrix — every ledger check, every commit
      </div>
      <div className="flex gap-2 overflow-x-auto">
        <div className="flex flex-col justify-around py-0.5 text-right">
          {labels.map((l) => (
            <span key={l} className="whitespace-nowrap text-[9px] leading-[14px] text-neutral-500">
              {l}
            </span>
          ))}
        </div>
        <div className="flex gap-1">
          {ordered.map((a, ci) => (
            <div key={ci} className="flex flex-col gap-1" title={`${a.supplier} · $${money(a.amount)}`}>
              {a.checks.map((c) => (
                <span
                  key={c.label}
                  className={`h-3.5 w-3.5 rounded-[3px] ${c.pass ? "bg-emerald-400" : "bg-red-400"} ${a.humanApproved && c.label === "per-tx cap" ? "ring-1 ring-amber-400" : ""}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

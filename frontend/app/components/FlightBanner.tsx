"use client";

// The cinematic "transaction in flight" banner. Unlike the competitor's SimBanner
// (pure setTimeout fiction), every state here is the REAL Canton round-trip: the
// spinner shows while the POST is actually in flight, and the verdict text is the
// genuine CommitResponse.rejected/reason returned by the ledger. The money-shot —
// "REJECTED BY THE LEDGER — amount exceeds per-tx cap" — lands live, not faked.

export type FlightPhase = "submitting" | "ok" | "reject" | "error";

export interface Flight {
  phase: FlightPhase;
  label: string;
  detail?: string;
}

const THEME: Record<FlightPhase, { ring: string; bg: string; text: string; icon: string }> = {
  submitting: { ring: "ring-sky-200", bg: "bg-sky-50", text: "text-sky-700", icon: "" },
  ok: { ring: "ring-emerald-200", bg: "bg-emerald-50", text: "text-emerald-700", icon: "✓" },
  reject: { ring: "ring-red-200", bg: "bg-red-50", text: "text-red-700", icon: "✕" },
  error: { ring: "ring-amber-200", bg: "bg-amber-50", text: "text-amber-700", icon: "!" },
};

export function FlightBanner({ flight }: { flight: Flight | null }) {
  if (!flight) return null;
  const t = THEME[flight.phase];
  return (
    <div
      className={`mb-4 flex items-center gap-3 rounded-xl border border-transparent px-4 py-3 shadow-sm ring-1 ${t.ring} ${t.bg} ${t.text} animate-[fadeIn_180ms_ease-out]`}
      role="status"
      aria-live="polite"
    >
      <span className="grid h-6 w-6 flex-shrink-0 place-items-center">
        {flight.phase === "submitting" ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : flight.phase === "reject" ? (
          <span className="text-base font-bold">✕</span>
        ) : (
          <span className="text-base font-bold">{t.icon}</span>
        )}
      </span>
      <div className="min-w-0">
        <div className="text-sm font-semibold">{flight.label}</div>
        {flight.detail && <div className="truncate text-xs opacity-80">{flight.detail}</div>}
      </div>
      <span className="ml-auto whitespace-nowrap text-[10px] font-medium uppercase tracking-wider opacity-60">
        {flight.phase === "submitting" ? "Canton · in flight" : "live ledger"}
      </span>
    </div>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type { StateSnapshot, CommitMode, AuditEntry, RevocationEntry } from "@/app/lib/types";
import { fetchState, postCommit, postIssue, postRevoke, postEscalate, postApprove, postReject } from "@/app/lib/api";
import { Button, Card, Chip, MoneyGauge, money, Stat } from "@/app/components/ui";
import { SpendAnalytics } from "@/app/components/charts";
import { FlightBanner, type Flight } from "@/app/components/FlightBanner";
import { Sidebar } from "@/app/demo/components/Sidebar";

type LogKind = "ok" | "reject" | "error" | "info";
interface LogEntry {
  id: number;
  time: string;
  kind: LogKind;
  text: string;
}

type Role = "cockpit" | "treasurer" | "agent" | "supplier" | "regulator";

/* ---------- sign-in icons ---------- */
const svg = (children: ReactNode) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
);
const IconArrow = () => svg(<path d="M5 12h14M13 6l6 6-6 6" />);
const IconBank = () => svg(<><path d="m4 10 8-6 8 6" /><path d="M5 10v9M19 10v9M9.5 10v9M14.5 10v9" /><path d="M3 20h18" /></>);
const IconBot = () => svg(<><rect x="4" y="8" width="16" height="12" rx="2" /><path d="M12 8V4M9 13h.01M15 13h.01M9.5 17h5" /><path d="M2 13h2M20 13h2" /></>);
const IconBox = () => svg(<><path d="m21 8-9-5-9 5 9 5 9-5z" /><path d="M3 8v8l9 5 9-5V8" /><path d="M12 13v8" /></>);
const IconShield = () => svg(<><path d="M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6z" /><path d="m9.5 12 2 2 3.5-4" /></>);
const IconGrid = () => svg(<><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>);
const IconScale = () => svg(<><path d="M12 3v18M8 21h8M6 7h12" /><path d="M6 7 3.5 12.5a2.5 2.5 0 0 0 5 0L6 7zM18 7l-2.5 5.5a2.5 2.5 0 0 0 5 0L18 7z" /></>);

const PARTIES = [
  { key: "treasurer", title: "Treasurer Console", sub: "issuer · holds mandate authority", icon: IconBank, chip: "bg-sky-50 text-sky-600 ring-sky-100" },
  { key: "agent", title: "Buyer Agent", sub: "autonomous buyer · spends on policy", icon: IconBot, chip: "bg-violet-50 text-violet-600 ring-violet-100" },
  { key: "supplier", title: "Supplier A", sub: "counterparty · receives a slice", icon: IconBox, chip: "bg-emerald-50 text-emerald-600 ring-emerald-100" },
  { key: "regulator", title: "Regulator / Auditor", sub: "read-only supervisor · sees the audit trail", icon: IconScale, chip: "bg-amber-50 text-amber-600 ring-amber-100" },
] as const;

const SESSION_META: Record<Role, { label: string; icon: () => ReactNode; chip: string }> = {
  treasurer: { label: "Treasurer", icon: IconBank, chip: "bg-sky-50 text-sky-600 ring-sky-100" },
  agent: { label: "Buyer Agent", icon: IconBot, chip: "bg-violet-50 text-violet-600 ring-violet-100" },
  supplier: { label: "Supplier A", icon: IconBox, chip: "bg-emerald-50 text-emerald-600 ring-emerald-100" },
  regulator: { label: "Regulator", icon: IconScale, chip: "bg-amber-50 text-amber-600 ring-amber-100" },
  cockpit: { label: "Cockpit · all parties", icon: IconGrid, chip: "bg-neutral-100 text-neutral-600 ring-neutral-200" },
};

/* ---------- collapsible audit row (regulator view) ---------- */
function AuditRow({ a }: { a: AuditEntry }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border border-neutral-200 bg-white">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left"
      >
        <span className="flex items-center gap-1.5 text-sm font-semibold text-neutral-900">
          <span className={`text-neutral-400 transition-transform ${open ? "rotate-90" : ""}`}>›</span>
          {a.supplier}
          {a.humanApproved && (
            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-700 ring-1 ring-amber-200">
              ⤴ human-approved
            </span>
          )}
        </span>
        <span className="flex items-center gap-2">
          <span className="font-mono text-sm text-neutral-900">${money(a.amount)}</span>
        </span>
      </button>
      {open && (
        <div className="border-t border-neutral-100 px-3 pb-3 pt-2">
          <div className="mb-2 flex flex-wrap gap-1">
            {a.checks.map((c) => (
              <span
                key={c.label}
                className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${c.pass ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" : "bg-red-50 text-red-700 ring-1 ring-red-200"}`}
              >
                {c.pass ? "✓" : "✗"} {c.label}
              </span>
            ))}
          </div>
          <p className="text-[11px] text-neutral-500">
            <span className="italic">&ldquo;{a.agentNote}&rdquo;</span>{" "}
            <span className="text-neutral-400">— agent note (advisory)</span>
          </p>
          <div className="mt-1.5 flex items-center justify-between text-[10px] text-neutral-400">
            <span className="font-mono">{a.mandateId}</span>
            <span className="font-mono">{new Date(a.committedAt).toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- revocations panel (regulator view) ---------- */
function RevocationsPanel({ revocations }: { revocations: RevocationEntry[] }) {
  if (revocations.length === 0) return null;
  return (
    <div className="rounded-lg bg-red-50 p-3 ring-1 ring-red-200">
      <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-red-700">
        Revocations ({revocations.length}) — audited kill events
      </div>
      <div className="space-y-1.5">
        {revocations.map((r, i) => (
          <div key={i} className="rounded-md bg-white p-2 text-[11px] ring-1 ring-red-100">
            <div className="flex items-center justify-between">
              <span className="font-mono font-semibold text-neutral-800">{r.mandateId}</span>
              <span className="rounded bg-red-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-red-700">
                {r.role}
              </span>
            </div>
            <p className="mt-0.5 italic text-neutral-500">&ldquo;{r.reason}&rdquo;</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const [snap, setSnap] = useState<StateSnapshot | null>(null);
  const [connected, setConnected] = useState(false);
  const [budgetMax, setBudgetMax] = useState(0);
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [session, setSession] = useState<Role | null>(null);
  const [flight, setFlight] = useState<Flight | null>(null);
  const logId = useRef(0);
  const flightTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const addLog = useCallback((kind: LogKind, text: string) => {
    const time = new Date().toLocaleTimeString("en-US", { hour12: false });
    setLog((l) => [{ id: ++logId.current, time, kind, text }, ...l].slice(0, 12));
  }, []);

  // Drive the live "in flight" banner. A terminal phase auto-dismisses; a
  // "submitting" phase stays until the real ledger response replaces it.
  const showFlight = useCallback((f: Flight | null) => {
    if (flightTimer.current) clearTimeout(flightTimer.current);
    setFlight(f);
    if (f && f.phase !== "submitting") {
      flightTimer.current = setTimeout(() => setFlight(null), 4500);
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      const s = await fetchState();
      setSnap(s);
      setConnected(true);
      const rem = s.treasurer.mandate ? Number(s.treasurer.mandate.remainingBudget) : 0;
      setBudgetMax((m) => Math.max(m, rem));
    } catch {
      setConnected(false);
    }
  }, []);

  useEffect(() => {
    const initial = setTimeout(refresh, 0);
    const t = setInterval(refresh, 1500);
    return () => {
      clearTimeout(initial);
      clearInterval(t);
    };
  }, [refresh]);

  const run = useCallback(
    async (fn: () => Promise<void>) => {
      setBusy(true);
      try {
        await fn();
      } finally {
        setBusy(false);
        refresh();
      }
    },
    [refresh],
  );

  const onIssue = () =>
    run(async () => {
      showFlight({ phase: "submitting", label: "Issuing a fresh mandate…", detail: "Charter → MintMandate on Canton" });
      const r = await postIssue();
      if (r.ok) {
        showFlight({ phase: "ok", label: "Mandate issued", detail: "$50,000 budget · $10,000 per-tx cap · 30-day expiry" });
        addLog("info", "Treasurer issued a fresh $50,000 mandate.");
      } else {
        showFlight({ phase: "error", label: "Issue failed", detail: r.error });
        addLog("error", `Issue failed: ${r.error}`);
      }
      setBudgetMax(0);
    });

  const onRevoke = () =>
    run(async () => {
      showFlight({ phase: "submitting", label: "Revoking the mandate…", detail: "Archiving + emitting an audited RevocationRecord" });
      const r = await postRevoke();
      if (r.ok) {
        showFlight({ phase: "ok", label: "Mandate revoked", detail: "The agent is now powerless · kill logged for the regulator" });
        addLog("info", "Treasurer REVOKED the mandate — the agent is now powerless.");
      } else {
        showFlight({ phase: "error", label: "Revoke failed", detail: r.error });
        addLog("error", `Revoke failed: ${r.error}`);
      }
    });

  const onCommit = (mode: CommitMode) =>
    run(async () => {
      const intent =
        mode === "cheapest"
          ? "Committing the cheapest compliant quote…"
          : mode === "overcap"
            ? "Attempting an over-cap purchase…"
            : "Attempting an off-allow-list supplier…";
      showFlight({ phase: "submitting", label: intent, detail: "Submitting to the Canton ledger" });
      const r = await postCommit(mode);
      if (r.ok) {
        showFlight({ phase: "ok", label: `Committed $${money(r.amount)} to ${r.supplier}`, detail: "Atomic settle — mandate debited + PO + cash" });
        addLog("ok", `COMMIT OK — $${money(r.amount)} to ${r.supplier}, settled atomically (mandate debited + PO + cash).`);
      } else if (r.rejected) {
        showFlight({ phase: "reject", label: "REJECTED BY THE LEDGER", detail: r.reason });
        addLog("reject", `REJECTED BY THE LEDGER — "${r.reason}". Nothing debited, no PO, no payment.`);
      } else {
        showFlight({ phase: "error", label: "Commit error", detail: r.error });
        addLog("error", r.error ?? "commit error");
      }
    });

  const onEscalate = () =>
    run(async () => {
      showFlight({ phase: "submitting", label: "Raising an approval request…", detail: "Over-cap buy — routed to the treasurer" });
      const r = await postEscalate();
      if (r.ok) {
        showFlight({ phase: "ok", label: `Escalated $${money(r.amount)} to ${r.supplier}`, detail: "Awaiting treasurer approval — agent cannot self-approve" });
        addLog("info", `Agent ESCALATED $${money(r.amount)} to ${r.supplier} — over-cap, awaiting treasurer approval.`);
      } else {
        showFlight({ phase: "error", label: "Escalate failed", detail: r.error });
        addLog("error", `Escalate failed: ${r.error}`);
      }
    });

  const onApprove = () =>
    run(async () => {
      showFlight({ phase: "submitting", label: "Approving over-cap purchase…", detail: "Treasurer co-signs CommitApproved on Canton" });
      const r = await postApprove();
      if (r.ok) {
        showFlight({ phase: "ok", label: `Approved $${money(r.amount)} to ${r.supplier}`, detail: "Committed over-cap · audited human-approved" });
        addLog("ok", `TREASURER APPROVED — $${money(r.amount)} to ${r.supplier} committed over-cap, audited human-approved.`);
      } else if (r.rejected) {
        showFlight({ phase: "reject", label: "REJECTED BY THE LEDGER", detail: r.reason });
        addLog("reject", `REJECTED BY THE LEDGER — "${r.reason}".`);
      } else {
        showFlight({ phase: "error", label: "Approve error", detail: r.error });
        addLog("error", r.error ?? "approve error");
      }
    });

  const onReject = () =>
    run(async () => {
      showFlight({ phase: "submitting", label: "Rejecting the escalation…", detail: "Archiving the request — nothing committed" });
      const r = await postReject();
      if (r.ok) {
        showFlight({ phase: "ok", label: "Escalation rejected", detail: "Nothing committed · budget untouched" });
        addLog("info", `TREASURER REJECTED the escalation — nothing committed.`);
      } else {
        showFlight({ phase: "error", label: "Reject failed", detail: r.error });
        addLog("error", `Reject failed: ${r.error}`);
      }
    });

  const mandate = snap?.treasurer.mandate ?? null;
  const charter = snap?.treasurer.charter ?? null;
  const pendingApprovals = snap?.treasurer.pendingApprovals ?? [];
  const supplier = snap?.supplier;
  const agent = snap?.agent;

  // --- the three party views (rendered in both cockpit and single-login layouts) ---

  const treasurerCard = (
    <Card title="Treasurer Console" subtitle="issuer" accent="sky">
      {charter && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg bg-sky-50 px-3 py-2 text-[11px] ring-1 ring-sky-100">
          <span className="font-semibold text-sky-700">⛓ Chartered by CEO + CFO</span>
          <span className="ml-auto font-mono text-sky-600">
            ceiling ≤ ${money(charter.ceilingPerTxCap)}/tx · ${money(charter.ceilingBudget)}
          </span>
        </div>
      )}
      {mandate ? (
        <>
          <MoneyGauge
            remaining={Number(mandate.remainingBudget)}
            total={budgetMax || Number(mandate.remainingBudget)}
          />
          <div className="space-y-2 border-t border-neutral-100 pt-3">
            <Stat
              label="Mandate"
              value={
                <span className="inline-flex items-center gap-1.5">
                  <span className="font-mono text-xs">{mandate.mandateId}</span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[9px] font-semibold ring-1 ${
                      mandate.allowAutoCommit
                        ? "bg-violet-50 text-violet-700 ring-violet-200"
                        : "bg-neutral-100 text-neutral-600 ring-neutral-200"
                    }`}
                  >
                    {mandate.allowAutoCommit ? "auto-commit" : "escalate-only"}
                  </span>
                </span>
              }
            />
            <Stat label="Per-transaction cap" value={`$${money(mandate.perTxCap)}`} mono />
            <Stat label="Category" value={mandate.category} />
            <Stat label="Expires" value={new Date(mandate.expiry).toLocaleDateString()} />
          </div>
          <div>
            <div className="mb-1.5 text-xs text-neutral-500">Approved suppliers</div>
            <div className="flex flex-wrap gap-1.5">
              {mandate.approvedSuppliers.map((s) => (
                <Chip key={s} tone="emerald">
                  {s}
                </Chip>
              ))}
            </div>
          </div>
        </>
      ) : (
        <p className="text-sm text-neutral-500">No active mandate. Issue one to begin.</p>
      )}

      {pendingApprovals.length > 0 && (
        <div className="space-y-2 rounded-lg bg-amber-50 p-3 ring-1 ring-amber-200">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-amber-700">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
            </span>
            {pendingApprovals.length} escalation{pendingApprovals.length > 1 ? "s" : ""} awaiting you
          </div>
          {pendingApprovals.map((p, i) => (
            <div key={i} className="rounded-md bg-white p-2.5 ring-1 ring-amber-100">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-neutral-800">{p.supplier}</span>
                <span className="font-mono font-semibold text-amber-700">${money(p.amount)}</span>
              </div>
              <p className="mt-1 text-[11px] italic leading-snug text-neutral-500">&ldquo;{p.reason}&rdquo;</p>
              <div className="mt-2 flex gap-2">
                <Button variant="primary" onClick={onApprove} disabled={busy}>
                  Approve over-cap
                </Button>
                <Button variant="ghost" onClick={onReject} disabled={busy}>
                  Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-auto flex gap-2 pt-2">
        <Button variant="ghost" onClick={onIssue} disabled={busy}>
          {mandate ? "Reset mandate" : "Issue mandate"}
        </Button>
        <Button variant="danger" onClick={onRevoke} disabled={busy || !mandate}>
          Revoke
        </Button>
      </div>
    </Card>
  );

  const agentCard = (
    <Card title="Buyer Agent" subtitle="runs the sealed auction" accent="violet">
      <div className="rounded-lg bg-neutral-50 p-3 ring-1 ring-neutral-200">
        <div className="mb-2 text-xs text-neutral-500">Sealed quotes (rivals can&apos;t see each other)</div>
        <div className="space-y-1.5">
          {agent?.quotes.length ? (
            agent.quotes.map((q, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-neutral-700">{q.supplier}</span>
                <span className="flex items-center gap-2">
                  <span className="font-mono text-neutral-900">${money(q.price)}</span>
                  <Chip tone={q.kind === "compliant" ? "emerald" : q.kind === "over-cap" ? "amber" : "red"}>
                    {q.kind}
                  </Chip>
                </span>
              </div>
            ))
          ) : (
            <p className="text-sm text-neutral-400">No quotes.</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Button variant="primary" onClick={() => onCommit("cheapest")} disabled={busy || !mandate}>
          Commit cheapest
        </Button>
        <Button variant="warn" onClick={() => onCommit("overcap")} disabled={busy || !mandate}>
          Try over-cap
        </Button>
        <Button variant="danger" onClick={() => onCommit("offlist")} disabled={busy || !mandate}>
          Try off-list
        </Button>
      </div>

      <button
        onClick={onEscalate}
        disabled={busy || !mandate}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-amber-300 bg-amber-50/50 px-3 py-2 text-xs font-semibold text-amber-700 transition hover:border-amber-500 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        ⤴ Escalate over-cap → request human approval
      </button>

      <div className="flex-1">
        <div className="mb-1.5 text-xs text-neutral-500">Ledger activity</div>
        <div className="space-y-1.5">
          {log.length === 0 && <p className="text-sm text-neutral-400">Awaiting actions…</p>}
          {log.map((e) => (
            <div
              key={e.id}
              className={`rounded-md border-l-2 bg-neutral-50 px-3 py-2 text-xs ${
                e.kind === "ok"
                  ? "border-emerald-500 text-emerald-700"
                  : e.kind === "reject"
                    ? "border-red-500 text-red-700"
                    : e.kind === "error"
                      ? "border-amber-500 text-amber-700"
                      : "border-sky-500 text-sky-700"
              }`}
            >
              <span className="mr-2 font-mono text-neutral-400">{e.time}</span>
              {e.text}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );

  const supplierCard = (
    <Card title={supplier?.label ?? "Supplier A"} subtitle="counterparty" accent="emerald">
      <div className="rounded-lg bg-neutral-50 p-3 ring-1 ring-neutral-200">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-lg">{supplier && !supplier.canSeeMandate ? "🔒" : "⚠️"}</span>
          <span className={`font-medium ${supplier && !supplier.canSeeMandate ? "text-emerald-700" : "text-amber-700"}`}>
            {supplier && !supplier.canSeeMandate ? "Mandate & budget: NOT VISIBLE" : "Mandate visible (unexpected)"}
          </span>
        </div>
        <p className="mt-1 text-[11px] text-neutral-500">
          The cap and remaining budget never reach this node — so you can&apos;t price up to it.
        </p>
      </div>

      <Stat label="Your sealed quote" value={supplier?.ownQuote ? `$${money(supplier.ownQuote.price)}` : "—"} mono />

      <div className="mt-auto">
        {supplier?.purchaseOrder ? (
          <div className="rounded-xl bg-emerald-50 p-4 text-center ring-1 ring-emerald-200">
            <div className="text-xs font-semibold uppercase tracking-wider text-emerald-700">✓ Authorized + Funded</div>
            <div className="mt-1 font-mono text-2xl font-bold text-emerald-700">
              ${money(supplier.purchaseOrder.amount)}
            </div>
            <div className="mt-1 text-[11px] text-emerald-600/80">cap &amp; remaining budget: hidden</div>
          </div>
        ) : (
          <div className="rounded-xl bg-neutral-50 p-4 text-center text-sm text-neutral-400 ring-1 ring-neutral-200">
            Awaiting award…
          </div>
        )}
      </div>
    </Card>
  );

  const sessionNote: Record<Exclude<Role, "cockpit">, string> = {
    treasurer: "You hold the mandate authority — issue and revoke. You see the cap and live consumption.",
    agent: "You can spend only within the encoded mandate. The ledger rejects anything off-policy — not a prompt.",
    supplier: "You only ever receive your own slice. The cap never reaches your node — find it, you can't.",
    regulator: "Read-only supervisor. You see every authorized purchase + its on-chain audit, but never the cap, budget, or sealed bids.",
  };

  const reg = snap?.regulator;
  const regulatorCard = (
    <Card title="Regulator / Auditor" subtitle="read-only supervisor" accent="sky">
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-emerald-50 p-3 ring-1 ring-emerald-200">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">Can see</div>
          <ul className="mt-1 space-y-1 text-[11px] text-emerald-800">
            <li>✓ Authorized purchase orders</li>
            <li>✓ On-chain audit + rationale</li>
          </ul>
        </div>
        <div className="rounded-lg bg-neutral-50 p-3 ring-1 ring-neutral-200">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Cannot see</div>
          <ul className="mt-1 space-y-1 text-[11px] text-neutral-500">
            <li>🔒 Cap &amp; budget <span className="font-mono text-neutral-400">{reg && !reg.canSeeMandate ? "[]" : ""}</span></li>
            <li>🔒 Sealed bids <span className="font-mono text-neutral-400">{reg && !reg.canSeeQuotes ? "[]" : ""}</span></li>
          </ul>
        </div>
      </div>

      {reg && reg.revocations.length > 0 && <RevocationsPanel revocations={reg.revocations} />}

      <div className="flex-1">
        <div className="mb-1.5 text-xs text-neutral-500">
          On-chain audit trail ({reg?.auditTrail.length ?? 0}) · click a row to expand
        </div>
        {reg && reg.auditTrail.length > 0 ? (
          <div className="space-y-2">
            {reg.auditTrail.map((a, i) => (
              <AuditRow key={i} a={a} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-neutral-400">No commits yet — have the Buyer Agent commit a purchase.</p>
        )}
      </div>

      <p className="text-[10px] leading-relaxed text-neutral-400">
        Ledger verdict = authority · agent note = advisory · live Canton query, not mocked.
      </p>
    </Card>
  );

  // Privacy-aware: only the treasurer/agent/cockpit views may see live budget.
  const showBudget = session === "treasurer" || session === "agent" || session === "cockpit";

  let sidebar: ReactNode = null;
  if (session) {
    const meta = SESSION_META[session];
    const Icon = meta.icon;
    sidebar = (
      <Sidebar
        roleLabel={meta.label}
        roleIcon={<Icon />}
        roleChip={meta.chip}
        connected={connected}
        mandate={mandate}
        showBudget={showBudget}
        pendingCount={pendingApprovals.length}
        onLogout={() => setSession(null)}
      />
    );
  }

  let identityBar: ReactNode = null;
  if (session) {
    const meta = SESSION_META[session];
    const Icon = meta.icon;
    identityBar = (
      <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 shadow-sm">
        <div className="flex items-center gap-2.5">
          <span className={`grid h-7 w-7 place-items-center rounded-lg ring-1 ${meta.chip}`}>
            <Icon />
          </span>
          <span className="text-sm">
            <span className="text-neutral-400">Signed in as </span>
            <span className="font-semibold text-neutral-900">{meta.label}</span>
          </span>
        </div>
        <button
          onClick={() => setSession(null)}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
        >
          Log out
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#f5f5f3] text-neutral-900 [background-image:radial-gradient(circle,rgba(0,0,0,0.035)_1px,transparent_1px)] [background-size:26px_26px]">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between gap-4 border-b border-neutral-200 pb-4">
          <div className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="MandateRail" width={32} height={32} className="h-8 w-8 rounded-full object-cover ring-1 ring-neutral-200" />
            <span className="text-lg font-bold tracking-tight text-neutral-900">MandateRail</span>
            <span className="rounded-md bg-violet-100 px-2 py-0.5 text-[11px] font-semibold text-violet-700 ring-1 ring-violet-200">on Canton</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="inline-flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${connected ? "animate-pulse bg-emerald-500" : "bg-red-500"}`} />
              <span className={connected ? "text-emerald-600" : "text-red-600"}>{connected ? "ledger live" : "disconnected"}</span>
            </span>
            <Link href="/" className="text-neutral-500 transition hover:text-neutral-900">← Home</Link>
          </div>
        </header>

        {session === null ? (
          /* Sign-in — Canton identity, no browser wallet */
          <div className="grid min-h-[62vh] place-items-center px-4">
            <div className="w-full max-w-md">
              <div className="mb-7 flex flex-col items-center text-center">
                <Image src="/logo.png" alt="MandateRail" width={48} height={48} className="h-12 w-12 rounded-2xl object-cover shadow-sm ring-1 ring-neutral-200" />
                <h2 className="mt-4 text-2xl font-bold tracking-tight text-neutral-900">Choose your identity</h2>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-neutral-500">
                  Canton has no browser wallet — sign in as a party. Each session is a per-party JWT (enterprise SSO/OIDC in production).
                </p>
              </div>

              <div className="space-y-2.5">
                {PARTIES.map((p) => {
                  const Icon = p.icon;
                  return (
                    <button
                      key={p.key}
                      onClick={() => setSession(p.key)}
                      className="group flex w-full items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-4 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-neutral-900 hover:shadow-md"
                    >
                      <span className={`grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl ring-1 transition duration-200 group-hover:scale-105 ${p.chip}`}>
                        <Icon />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-neutral-900">{p.title}</span>
                        <span className="block truncate text-xs text-neutral-500">{p.sub}</span>
                      </span>
                      <span className="text-neutral-300 transition group-hover:translate-x-0.5 group-hover:text-neutral-900">
                        <IconArrow />
                      </span>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setSession("cockpit")}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-neutral-300 p-3.5 text-sm font-semibold text-neutral-600 transition hover:border-neutral-900 hover:text-neutral-900"
              >
                <IconGrid /> View all parties · cockpit
              </button>

              <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-neutral-400">
                <IconShield /> Per-party JWT · no seed phrase · no browser wallet
              </div>
            </div>
          </div>
        ) : (
          <div className="flex gap-6">
            {sidebar}
            <div className="min-w-0 flex-1">
              <div className="lg:hidden">{identityBar}</div>
              <FlightBanner flight={flight} />

              {session === "cockpit" ? (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                    {treasurerCard}
                    {agentCard}
                    {supplierCard}
                    {regulatorCard}
                  </div>
                  <SpendAnalytics
                    trail={reg?.auditTrail ?? []}
                    perTxCap={mandate ? Number(mandate.perTxCap) : 0}
                    remainingBudget={mandate ? Number(mandate.remainingBudget) : 0}
                  />
                </div>
              ) : (
                <div className="mx-auto max-w-xl">
                  <div className="mb-3 rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-xs leading-relaxed text-neutral-500">
                    {sessionNote[session as Exclude<Role, "cockpit">]}
                  </div>
                  {session === "treasurer"
                    ? treasurerCard
                    : session === "agent"
                      ? agentCard
                      : session === "supplier"
                        ? supplierCard
                        : regulatorCard}
                  {session === "agent" && (
                    <div className="mt-5">
                      <SpendAnalytics
                        trail={reg?.auditTrail ?? []}
                        perTxCap={mandate ? Number(mandate.perTxCap) : 0}
                        remainingBudget={mandate ? Number(mandate.remainingBudget) : 0}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        <footer className="mt-8 text-center text-[11px] text-neutral-400">
          Bounded. Private. Atomic. · Daml + Canton sandbox · MandateRail
        </footer>
      </div>
    </div>
  );
}

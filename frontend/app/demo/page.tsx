"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { StateSnapshot, CommitMode } from "@/app/lib/types";
import { fetchState, postCommit, postIssue, postRevoke } from "@/app/lib/api";
import { Button, Card, Chip, MoneyGauge, money, Stat } from "@/app/components/ui";

type LogKind = "ok" | "reject" | "error" | "info";
interface LogEntry {
  id: number;
  time: string;
  kind: LogKind;
  text: string;
}

const ROLES = [
  { key: "cockpit", label: "Cockpit (all)" },
  { key: "treasurer", label: "Treasurer" },
  { key: "agent", label: "Buyer Agent" },
  { key: "supplier", label: "Supplier A" },
] as const;
type Role = (typeof ROLES)[number]["key"];

export default function Home() {
  const [snap, setSnap] = useState<StateSnapshot | null>(null);
  const [connected, setConnected] = useState(false);
  const [budgetMax, setBudgetMax] = useState(0);
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [session, setSession] = useState<Role | null>(null);
  const logId = useRef(0);

  const addLog = useCallback((kind: LogKind, text: string) => {
    const time = new Date().toLocaleTimeString("en-US", { hour12: false });
    setLog((l) => [{ id: ++logId.current, time, kind, text }, ...l].slice(0, 12));
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
      const r = await postIssue();
      addLog(r.ok ? "info" : "error", r.ok ? "Treasurer issued a fresh $50,000 mandate." : `Issue failed: ${r.error}`);
      setBudgetMax(0);
    });

  const onRevoke = () =>
    run(async () => {
      const r = await postRevoke();
      addLog(
        r.ok ? "info" : "error",
        r.ok ? "Treasurer REVOKED the mandate — the agent is now powerless." : `Revoke failed: ${r.error}`,
      );
    });

  const onCommit = (mode: CommitMode) =>
    run(async () => {
      const r = await postCommit(mode);
      if (r.ok)
        addLog("ok", `COMMIT OK — $${money(r.amount)} to ${r.supplier}, settled atomically (mandate debited + PO + cash).`);
      else if (r.rejected)
        addLog("reject", `REJECTED BY THE LEDGER — "${r.reason}". Nothing debited, no PO, no payment.`);
      else addLog("error", r.error ?? "commit error");
    });

  const mandate = snap?.treasurer.mandate ?? null;
  const supplier = snap?.supplier;
  const agent = snap?.agent;

  // --- the three party views (rendered in both cockpit and single-login layouts) ---

  const treasurerCard = (
    <Card title="Treasurer Console" subtitle="issuer" accent="sky">
      {mandate ? (
        <>
          <MoneyGauge
            remaining={Number(mandate.remainingBudget)}
            total={budgetMax || Number(mandate.remainingBudget)}
          />
          <div className="space-y-2 border-t border-slate-800 pt-3">
            <Stat label="Per-transaction cap" value={`$${money(mandate.perTxCap)}`} mono />
            <Stat label="Category" value={mandate.category} />
            <Stat label="Expires" value={new Date(mandate.expiry).toLocaleDateString()} />
          </div>
          <div>
            <div className="mb-1.5 text-xs text-slate-400">Approved suppliers</div>
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
        <p className="text-sm text-slate-500">No active mandate. Issue one to begin.</p>
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
      <div className="rounded-lg bg-slate-950/50 p-3 ring-1 ring-slate-800">
        <div className="mb-2 text-xs text-slate-400">Sealed quotes (rivals can&apos;t see each other)</div>
        <div className="space-y-1.5">
          {agent?.quotes.length ? (
            agent.quotes.map((q, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-slate-300">{q.supplier}</span>
                <span className="flex items-center gap-2">
                  <span className="font-mono text-slate-200">${money(q.price)}</span>
                  <Chip tone={q.kind === "compliant" ? "emerald" : q.kind === "over-cap" ? "amber" : "red"}>
                    {q.kind}
                  </Chip>
                </span>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">No quotes.</p>
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

      <div className="flex-1">
        <div className="mb-1.5 text-xs text-slate-400">Ledger activity</div>
        <div className="space-y-1.5">
          {log.length === 0 && <p className="text-sm text-slate-600">Awaiting actions…</p>}
          {log.map((e) => (
            <div
              key={e.id}
              className={`rounded-md border-l-2 bg-slate-950/40 px-3 py-2 text-xs ${
                e.kind === "ok"
                  ? "border-emerald-500 text-emerald-200"
                  : e.kind === "reject"
                    ? "border-red-500 text-red-200"
                    : e.kind === "error"
                      ? "border-amber-500 text-amber-200"
                      : "border-sky-500 text-sky-200"
              }`}
            >
              <span className="mr-2 font-mono text-slate-500">{e.time}</span>
              {e.text}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );

  const supplierCard = (
    <Card title={supplier?.label ?? "Supplier A"} subtitle="counterparty" accent="emerald">
      <div className="rounded-lg bg-slate-950/50 p-3 ring-1 ring-slate-800">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-lg">{supplier && !supplier.canSeeMandate ? "🔒" : "⚠️"}</span>
          <span className={supplier && !supplier.canSeeMandate ? "text-emerald-300" : "text-amber-300"}>
            {supplier && !supplier.canSeeMandate ? "Mandate & budget: NOT VISIBLE" : "Mandate visible (unexpected)"}
          </span>
        </div>
        <p className="mt-1 text-[11px] text-slate-500">
          The cap and remaining budget never reach this node — so you can&apos;t price up to it.
        </p>
      </div>

      <Stat label="Your sealed quote" value={supplier?.ownQuote ? `$${money(supplier.ownQuote.price)}` : "—"} mono />

      <div className="mt-auto">
        {supplier?.purchaseOrder ? (
          <div className="rounded-xl bg-emerald-500/10 p-4 text-center ring-1 ring-emerald-500/40">
            <div className="text-xs font-semibold uppercase tracking-wider text-emerald-300">✓ Authorized + Funded</div>
            <div className="mt-1 font-mono text-2xl font-bold text-emerald-200">
              ${money(supplier.purchaseOrder.amount)}
            </div>
            <div className="mt-1 text-[11px] text-emerald-400/70">cap &amp; remaining budget: hidden</div>
          </div>
        ) : (
          <div className="rounded-xl bg-slate-950/40 p-4 text-center text-sm text-slate-600 ring-1 ring-slate-800">
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
  };

  return (
    <div className="min-h-full w-full bg-[radial-gradient(60%_50%_at_50%_0%,#0f1b2d_0%,#020617_60%)] text-slate-200">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Header */}
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link href="/" className="mb-1 inline-block text-xs text-slate-500 transition hover:text-slate-300">
              ← Back to home
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-white">MandateRail</h1>
              <span className="rounded-md bg-violet-500/15 px-2 py-0.5 text-[11px] font-semibold text-violet-300 ring-1 ring-violet-600/40">
                on Canton
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-400">
              Confidential, ledger-enforced spend mandates for agentic procurement.{" "}
              <span className="text-slate-300">Trust the ledger, not the model.</span>
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className={`h-2 w-2 rounded-full ${connected ? "animate-pulse bg-emerald-400" : "bg-red-500"}`} />
            <span className={connected ? "text-emerald-300" : "text-red-300"}>
              {connected ? "ledger live" : "disconnected — is `daml start` running?"}
            </span>
          </div>
        </header>

        {session === null ? (
          /* Login screen — Canton identity, no browser wallet */
          <div className="grid min-h-[58vh] place-items-center">
            <div className="w-full max-w-md rounded-2xl bg-slate-900/70 p-6 ring-1 ring-slate-800">
              <h2 className="text-lg font-semibold text-white">Sign in</h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                Canton has no browser wallet. Choose the <span className="text-slate-300">party</span> (identity) to act
                as — auth is a per-party JWT minted server-side (enterprise SSO/OIDC in production).
              </p>
              <div className="mt-4 space-y-2">
                {(
                  [
                    ["treasurer", "Treasurer Console", "issuer · holds mandate authority"],
                    ["agent", "Buyer Agent", "autonomous buyer"],
                    ["supplier", "Supplier A", "counterparty"],
                  ] as const
                ).map(([key, title, sub]) => (
                  <button
                    key={key}
                    onClick={() => setSession(key)}
                    className="flex w-full items-center justify-between rounded-lg bg-slate-800 px-4 py-3 text-left transition hover:bg-slate-700"
                  >
                    <span className="text-sm font-semibold text-slate-100">{title}</span>
                    <span className="text-[11px] text-slate-400">{sub}</span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setSession("cockpit")}
                className="mt-3 w-full rounded-lg border border-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-800"
              >
                Open cockpit — view all parties (demo)
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Session bar: switch identity or log out */}
            <div className="mb-5 flex flex-wrap items-center gap-1 rounded-xl bg-slate-900/70 p-1.5 ring-1 ring-slate-800">
              <span className="px-2 text-xs font-medium text-slate-500">Logged in as</span>
              {ROLES.map((r) => (
                <button
                  key={r.key}
                  onClick={() => setSession(r.key)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    session === r.key ? "bg-slate-700 text-white shadow" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {r.label}
                </button>
              ))}
              <button
                onClick={() => setSession(null)}
                className="ml-auto rounded-lg px-3 py-1.5 text-xs font-semibold text-red-300 transition hover:bg-red-500/10"
              >
                Log out
              </button>
            </div>

            {session === "cockpit" ? (
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                {treasurerCard}
                {agentCard}
                {supplierCard}
              </div>
            ) : (
              <div className="mx-auto max-w-xl">
                <div className="mb-3 rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-2.5 text-xs text-slate-400">
                  <span className="font-semibold text-slate-200">
                    🔑 Session: {ROLES.find((r) => r.key === session)?.label}
                  </span>
                  {" — "}
                  {sessionNote[session as "treasurer" | "agent" | "supplier"]}
                </div>
                {session === "treasurer" ? treasurerCard : session === "agent" ? agentCard : supplierCard}
              </div>
            )}
          </>
        )}

        <footer className="mt-8 text-center text-[11px] text-slate-600">
          Bounded. Private. Atomic. · Daml + Canton sandbox · MandateRail
        </footer>
      </div>
    </div>
  );
}

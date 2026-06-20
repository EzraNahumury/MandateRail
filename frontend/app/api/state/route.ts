import { NextResponse } from "next/server";
import { TID, mintToken, query, parties } from "@/app/lib/daml";
import type {
  MandatePayload,
  QuotePayload,
  POPayload,
  AuditPayload,
  AuditEntry,
  ApprovalPayload,
  RevocationPayload,
  CharterPayload,
  StateSnapshot,
  QuoteKind,
} from "@/app/lib/types";
// A REAL /api/state output captured from a live Canton sandbox. Served read-only
// when no ledger is reachable (e.g. a Vercel deploy) so the live URL is browsable
// without a hosted ledger — genuine ledger output, not invented mock data.
import capturedSnapshot from "@/app/lib/snapshot.json";

export const dynamic = "force-dynamic";

export async function GET() {
  // Explicit snapshot mode for a hosted deploy with no ledger (e.g. Vercel:
  // set DEMO_SNAPSHOT=1). Serves the captured REAL ledger output, read-only.
  if (process.env.DEMO_SNAPSHOT === "1") {
    return NextResponse.json(
      { ...(capturedSnapshot as object), mode: "snapshot" },
      { headers: { "X-Mode": "snapshot" } },
    );
  }
  try {
    const { byName, byId } = await parties();
    const label = (id: string) => byId[id] ?? id.split("::")[0];
    const tok = (name: string) => mintToken([byName[name]]);

    const toEntry = (a: AuditPayload): AuditEntry => ({
      supplier: label(a.supplier),
      amount: a.amount,
      category: a.category,
      mandateId: a.mandateId,
      committedAt: a.committedAt,
      agentNote: a.agentNote,
      humanApproved: a.humanApproved,
      checks: [
        { label: "per-tx cap", pass: a.underPerTxCap },
        { label: "budget", pass: a.underBudget },
        { label: "allow-list", pass: a.supplierApproved },
        { label: "category", pass: a.categoryMatch },
        { label: "not expired", pass: a.notExpired },
      ],
    });
    const byNewest = (a: { committedAt: string }, b: { committedAt: string }) =>
      b.committedAt.localeCompare(a.committedAt);

    // Treasurer's view — sees the mandate (cap + remaining) + the charter ceilings.
    const treasurerTok = tok("Treasurer");
    const tMandates = await query<MandatePayload>(treasurerTok, [TID.mandate]);
    const mandate = tMandates[0]?.payload ?? null;
    const tCharters = await query<CharterPayload>(treasurerTok, [TID.charter]);
    const charter = tCharters[0]?.payload ?? null;
    // Escalations awaiting the treasurer's decision (over-cap requests the agent
    // raised but cannot commit itself). Treasurer is an observer of each request.
    const tApprovals = await query<ApprovalPayload>(treasurerTok, [TID.approval]);

    // Agent's view — runs the auction (sees all quotes), POs + audit it co-signed.
    const agentTok = tok("BuyerAgent");
    const quotes = await query<QuotePayload>(agentTok, [TID.quote]);
    const agentPOs = await query<POPayload>(agentTok, [TID.po]);
    const agentAudit = await query<AuditPayload>(agentTok, [TID.audit]);

    // Each supplier's OWN view — proves sealed-bid privacy per party: a supplier
    // is NOT a stakeholder of the mandate and only ever sees its own quote + award.
    const SUPPLIERS = [
      { key: "a", party: "SupplierA", label: "Supplier A" },
      { key: "b", party: "SupplierB", label: "Supplier B" },
      { key: "c", party: "SupplierC", label: "Supplier C" },
    ] as const;
    const suppliers = await Promise.all(
      SUPPLIERS.map(async (s) => {
        const t = tok(s.party);
        const sm = await query<MandatePayload>(t, [TID.mandate]); // expect []
        const sq = await query<QuotePayload>(t, [TID.quote]);
        const sp = await query<POPayload>(t, [TID.po]);
        return {
          key: s.key,
          label: s.label,
          canSeeMandate: sm.length > 0,
          ownQuotes: [...sq]
            .sort((a, b) => Number(a.payload.price) - Number(b.payload.price))
            .map((q) => ({ price: q.payload.price })),
          purchaseOrder: sp[0]?.payload
            ? { amount: sp[0].payload.amount, status: sp[0].payload.status }
            : null,
        };
      }),
    );

    // Regulator's view — sees POs + audit, NOT the mandate or sealed bids.
    const regTok = tok("Regulator");
    const regMandate = await query<MandatePayload>(regTok, [TID.mandate]); // expect []
    const regQuotes = await query<QuotePayload>(regTok, [TID.quote]); // expect []
    const regPOs = await query<POPayload>(regTok, [TID.po]);
    const regAudit = await query<AuditPayload>(regTok, [TID.audit]);
    const regRevocations = await query<RevocationPayload>(regTok, [TID.revocation]);

    const cap = mandate ? Number(mandate.perTxCap) : 0;
    const approved = new Set(mandate?.approvedSuppliers ?? []);
    const classify = (q: QuotePayload): QuoteKind =>
      !approved.has(q.supplier) ? "off-list" : Number(q.price) > cap ? "over-cap" : "compliant";
    const poView = (p: { payload: POPayload }) => ({
      supplier: label(p.payload.supplier),
      amount: p.payload.amount,
      status: p.payload.status,
    });

    const snapshot: StateSnapshot = {
      treasurer: {
        mandate: mandate
          ? {
              mandateId: mandate.mandateId,
              category: mandate.category,
              perTxCap: mandate.perTxCap,
              remainingBudget: mandate.remainingBudget,
              approvedSuppliers: mandate.approvedSuppliers.map(label),
              expiry: mandate.expiry,
              allowAutoCommit: mandate.allowAutoCommit,
            }
          : null,
        charter: charter
          ? { ceilingPerTxCap: charter.ceilingPerTxCap, ceilingBudget: charter.ceilingBudget }
          : null,
        pendingApprovals: tApprovals.map((a) => ({
          supplier: label(a.payload.supplier),
          amount: a.payload.amount,
          category: a.payload.category,
          reason: a.payload.reason,
        })),
      },
      agent: {
        hasMandate: !!mandate,
        remainingBudget: mandate?.remainingBudget ?? null,
        perTxCap: mandate?.perTxCap ?? null,
        quotes: quotes.map((q) => ({
          supplier: label(q.payload.supplier),
          price: q.payload.price,
          kind: classify(q.payload),
        })),
        purchaseOrders: agentPOs.map(poView),
        auditTrail: agentAudit.map((a) => toEntry(a.payload)).sort(byNewest),
      },
      suppliers,
      regulator: {
        canSeeMandate: regMandate.length > 0, // expect false — selective disclosure
        canSeeQuotes: regQuotes.length > 0, // expect false
        purchaseOrders: regPOs.map(poView),
        auditTrail: regAudit.map((a) => toEntry(a.payload)).sort(byNewest),
        revocations: regRevocations
          .map((r) => ({
            mandateId: r.payload.mandateId,
            revokedBy: label(r.payload.revokedBy),
            role: r.payload.role,
            reason: r.payload.reason,
            at: r.payload.at,
          }))
          .sort((a, b) => b.at.localeCompare(a.at)),
      },
    };

    return NextResponse.json({ ...snapshot, mode: "live" });
  } catch (e) {
    // No reachable ledger → serve the captured real snapshot read-only (so a
    // hosted UI without a backend still shows genuine ledger data). Local dev
    // with `daml start` up always takes the live path above.
    if (capturedSnapshot && typeof capturedSnapshot === "object") {
      return NextResponse.json(
        { ...(capturedSnapshot as object), mode: "snapshot" },
        { headers: { "X-Mode": "snapshot" } },
      );
    }
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

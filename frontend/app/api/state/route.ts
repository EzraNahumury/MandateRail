import { NextResponse } from "next/server";
import { TID, mintToken, query, parties } from "@/app/lib/daml";
import type {
  MandatePayload,
  QuotePayload,
  POPayload,
  AuditPayload,
  AuditEntry,
  CharterPayload,
  StateSnapshot,
  QuoteKind,
} from "@/app/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { byName, byId } = await parties();
    const label = (id: string) => byId[id] ?? id.split("::")[0];
    const tok = (name: string) => mintToken([byName[name]]);

    const toEntry = (a: AuditPayload): AuditEntry => ({
      supplier: label(a.supplier),
      amount: a.amount,
      category: a.category,
      committedAt: a.committedAt,
      agentNote: a.agentNote,
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

    // Agent's view — runs the auction (sees all quotes), POs + audit it co-signed.
    const agentTok = tok("BuyerAgent");
    const quotes = await query<QuotePayload>(agentTok, [TID.quote]);
    const agentPOs = await query<POPayload>(agentTok, [TID.po]);
    const agentAudit = await query<AuditPayload>(agentTok, [TID.audit]);

    // Supplier A's view — proves privacy: it is NOT a stakeholder of the mandate.
    const supTok = tok("SupplierA");
    const supMandate = await query<MandatePayload>(supTok, [TID.mandate]); // expect []
    const supQuotes = await query<QuotePayload>(supTok, [TID.quote]);
    const supPOs = await query<POPayload>(supTok, [TID.po]);

    // Regulator's view — sees POs + audit, NOT the mandate or sealed bids.
    const regTok = tok("Regulator");
    const regMandate = await query<MandatePayload>(regTok, [TID.mandate]); // expect []
    const regQuotes = await query<QuotePayload>(regTok, [TID.quote]); // expect []
    const regPOs = await query<POPayload>(regTok, [TID.po]);
    const regAudit = await query<AuditPayload>(regTok, [TID.audit]);

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
              category: mandate.category,
              perTxCap: mandate.perTxCap,
              remainingBudget: mandate.remainingBudget,
              approvedSuppliers: mandate.approvedSuppliers.map(label),
              expiry: mandate.expiry,
            }
          : null,
        charter: charter
          ? { ceilingPerTxCap: charter.ceilingPerTxCap, ceilingBudget: charter.ceilingBudget }
          : null,
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
      supplier: {
        label: "Supplier A",
        canSeeMandate: supMandate.length > 0,
        ownQuote: supQuotes[0]?.payload ? { price: supQuotes[0].payload.price } : null,
        purchaseOrder: supPOs[0]?.payload
          ? { amount: supPOs[0].payload.amount, status: supPOs[0].payload.status }
          : null,
      },
      regulator: {
        canSeeMandate: regMandate.length > 0, // expect false — selective disclosure
        canSeeQuotes: regQuotes.length > 0, // expect false
        purchaseOrders: regPOs.map(poView),
        auditTrail: regAudit.map((a) => toEntry(a.payload)).sort(byNewest),
      },
    };

    return NextResponse.json(snapshot);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { TID, mintToken, query, parties } from "@/app/lib/daml";
import type { MandatePayload, QuotePayload, POPayload, StateSnapshot, QuoteKind } from "@/app/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { byName, byId } = await parties();
    const label = (id: string) => byId[id] ?? id.split("::")[0];
    const tok = (name: string) => mintToken([byName[name]]);

    // Treasurer's view — sees the mandate (cap + remaining).
    const tMandates = await query<MandatePayload>(tok("Treasurer"), [TID.mandate]);
    const mandate = tMandates[0]?.payload ?? null;

    // Agent's view — runs the auction (sees all quotes), sees the POs it co-signed.
    const agentTok = tok("BuyerAgent");
    const quotes = await query<QuotePayload>(agentTok, [TID.quote]);
    const agentPOs = await query<POPayload>(agentTok, [TID.po]);

    // Supplier A's view — proves privacy: it is NOT a stakeholder of the mandate.
    const supTok = tok("SupplierA");
    const supMandate = await query<MandatePayload>(supTok, [TID.mandate]); // expect []
    const supQuotes = await query<QuotePayload>(supTok, [TID.quote]);
    const supPOs = await query<POPayload>(supTok, [TID.po]);

    const cap = mandate ? Number(mandate.perTxCap) : 0;
    const approved = new Set(mandate?.approvedSuppliers ?? []);
    const classify = (q: QuotePayload): QuoteKind =>
      !approved.has(q.supplier) ? "off-list" : Number(q.price) > cap ? "over-cap" : "compliant";

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
        purchaseOrders: agentPOs.map((p) => ({
          supplier: label(p.payload.supplier),
          amount: p.payload.amount,
          status: p.payload.status,
        })),
      },
      supplier: {
        label: "Supplier A",
        canSeeMandate: supMandate.length > 0,
        ownQuote: supQuotes[0]?.payload ? { price: supQuotes[0].payload.price } : null,
        purchaseOrder: supPOs[0]?.payload
          ? { amount: supPOs[0].payload.amount, status: supPOs[0].payload.status }
          : null,
      },
    };

    return NextResponse.json(snapshot);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

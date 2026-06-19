import { NextResponse } from "next/server";
import { TID, mintToken, query, create, parties } from "@/app/lib/daml";
import type { MandatePayload, QuotePayload, EscalateResponse } from "@/app/lib/types";

export const dynamic = "force-dynamic";

// Human-in-the-loop escalation. The agent has a legitimate over-cap need but the
// ledger BLOCKS it from committing. Instead it raises an ApprovalRequest that only
// the treasurer can act on. Agent-only token — the agent is powerless past this point.
export async function POST() {
  try {
    const { byName, byId } = await parties();
    const A = byName["BuyerAgent"];
    const agentTok = mintToken([A]);

    const mandates = await query<MandatePayload>(agentTok, [TID.mandate]);
    if (!mandates.length) {
      return NextResponse.json<EscalateResponse>({ ok: false, error: "No active mandate." }, { status: 400 });
    }
    const mandate = mandates[0].payload;
    const cap = Number(mandate.perTxCap);
    const approved = new Set(mandate.approvedSuppliers);

    const quotes = await query<QuotePayload>(agentTok, [TID.quote]);
    // The honest over-cap need: on the allow-list, right category, but above the cap.
    const quote = quotes.find(
      (q) =>
        approved.has(q.payload.supplier) &&
        q.payload.category === mandate.category &&
        Number(q.payload.price) > cap,
    );
    if (!quote) {
      return NextResponse.json<EscalateResponse>({ ok: false, error: "No over-cap quote to escalate." }, { status: 400 });
    }

    await create(agentTok, TID.approval, {
      treasurer: mandate.treasurer,
      agent: A,
      regulator: byName["Regulator"],
      supplier: quote.payload.supplier,
      amount: quote.payload.price,
      category: quote.payload.category,
      reason: "Over-cap quote is the lowest available for urgent capacity; requesting treasurer sign-off.",
    });

    return NextResponse.json<EscalateResponse>({
      ok: true,
      supplier: byId[quote.payload.supplier] ?? quote.payload.supplier.split("::")[0],
      amount: quote.payload.price,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json<EscalateResponse>({ ok: false, error: msg }, { status: 500 });
  }
}

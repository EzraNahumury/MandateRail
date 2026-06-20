import { NextResponse } from "next/server";
import { TID, mintToken, query, exercise, parties, ledgerReason } from "@/app/lib/daml";
import type { POPayload } from "@/app/lib/types";

export const dynamic = "force-dynamic";

// The DELIVERY leg of DvP. The buyer (agent) confirms goods/services received on
// a FUNDED_PENDING_DELIVERY purchase order; ConfirmReceipt releases the escrowed
// cash to the supplier and flips the order to SETTLED. Until this fires, the
// supplier is assured of funds (escrowed) but NOT paid — no paid-but-undelivered.
export async function POST() {
  try {
    const { byName, byId } = await parties();
    const agentTok = mintToken([byName["BuyerAgent"]]);

    const pos = await query<POPayload>(agentTok, [TID.po]);
    const pending = pos.find((p) => p.payload.status === "FUNDED_PENDING_DELIVERY");
    if (!pending) {
      return NextResponse.json({ ok: false, error: "No funded-pending-delivery order to confirm." }, { status: 400 });
    }

    try {
      await exercise(agentTok, TID.po, pending.contractId, "ConfirmReceipt", {});
      return NextResponse.json({
        ok: true,
        supplier: byId[pending.payload.supplier] ?? pending.payload.supplier.split("::")[0],
        amount: pending.payload.amount,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return NextResponse.json({ ok: false, rejected: true, reason: ledgerReason(msg) });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

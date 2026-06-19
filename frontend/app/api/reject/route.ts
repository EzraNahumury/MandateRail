import { NextResponse } from "next/server";
import { TID, mintToken, query, exercise, parties } from "@/app/lib/daml";
import type { ApprovalPayload, ApprovalActionResponse } from "@/app/lib/types";

export const dynamic = "force-dynamic";

// The treasurer rejects an escalation — the request is archived and nothing is
// committed. Treasurer-only token: rejecting is fully the human's call.
export async function POST() {
  try {
    const { byName, byId } = await parties();
    const tok = mintToken([byName["Treasurer"]]);

    const reqs = await query<ApprovalPayload>(tok, [TID.approval]);
    if (!reqs.length) {
      return NextResponse.json<ApprovalActionResponse>({ ok: false, error: "No pending approval." }, { status: 400 });
    }
    const req = reqs[0];

    await exercise(tok, TID.approval, req.contractId, "Reject", {});
    return NextResponse.json<ApprovalActionResponse>({
      ok: true,
      supplier: byId[req.payload.supplier] ?? req.payload.supplier.split("::")[0],
      amount: req.payload.amount,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json<ApprovalActionResponse>({ ok: false, error: msg }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { TID, mintToken, query, exercise, parties, ledgerReason } from "@/app/lib/daml";
import type {
  MandatePayload,
  QuotePayload,
  IouPayload,
  ApprovalPayload,
  ApprovalActionResponse,
} from "@/app/lib/types";

export const dynamic = "force-dynamic";

// The treasurer approves an escalation -> a SINGLE over-cap purchase goes through
// via CommitApproved (audited as human-approved). The over-cap quote is disclosed
// only to the agent, so the submission reads as [Treasurer, BuyerAgent]; but the
// agent has no power of its own — CommitApproved requires the TREASURER controller.
export async function POST() {
  try {
    const { byName, byId } = await parties();
    const tok = mintToken([byName["Treasurer"], byName["BuyerAgent"]]);

    const reqs = await query<ApprovalPayload>(tok, [TID.approval]);
    if (!reqs.length) {
      return NextResponse.json<ApprovalActionResponse>({ ok: false, error: "No pending approval." }, { status: 400 });
    }
    const req = reqs[0];

    const mandates = await query<MandatePayload>(tok, [TID.mandate]);
    if (!mandates.length) {
      return NextResponse.json<ApprovalActionResponse>({ ok: false, error: "No active mandate." }, { status: 400 });
    }
    const mandate = mandates[0];

    const quotes = await query<QuotePayload>(tok, [TID.quote]);
    const quote = quotes.find(
      (q) => q.payload.supplier === req.payload.supplier && q.payload.price === req.payload.amount,
    );
    if (!quote) {
      return NextResponse.json<ApprovalActionResponse>({ ok: false, error: "Escalated quote no longer available." }, { status: 400 });
    }

    const cash = await query<IouPayload>(tok, [TID.iou]);
    const fund =
      [...cash]
        .sort((a, b) => Number(b.payload.amount) - Number(a.payload.amount))
        .find((c) => Number(c.payload.amount) >= Number(req.payload.amount)) ?? cash[0];
    if (!fund) {
      return NextResponse.json<ApprovalActionResponse>({ ok: false, error: "No funded treasury Iou." }, { status: 400 });
    }

    try {
      await exercise(tok, TID.approval, req.contractId, "Approve", {
        mandateCid: mandate.contractId,
        quoteCid: quote.contractId,
        cashCid: fund.contractId,
      });
      return NextResponse.json<ApprovalActionResponse>({
        ok: true,
        supplier: byId[req.payload.supplier] ?? req.payload.supplier.split("::")[0],
        amount: req.payload.amount,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return NextResponse.json<ApprovalActionResponse>({ ok: false, rejected: true, reason: ledgerReason(msg) });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json<ApprovalActionResponse>({ ok: false, error: msg }, { status: 500 });
  }
}

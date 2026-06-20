import { NextResponse } from "next/server";
import { TID, mintToken, query, exercise, parties, ledgerReason } from "@/app/lib/daml";
import type { MandatePayload, QuotePayload, IouPayload, CommitResponse, CommitMode } from "@/app/lib/types";

export const dynamic = "force-dynamic";

const VALID_MODES: readonly CommitMode[] = ["cheapest", "overcap", "offlist"];

export async function POST(request: Request) {
  let mode: CommitMode = "cheapest";
  try {
    const body = (await request.json().catch(() => ({}))) as { mode?: unknown };
    // Strict allow-list on the only untrusted input. (No app-level amount
    // clamping needed — amount==quote.price and amount<=perTxCap are already
    // asserted by the ledger in Mandate.daml; the ledger, not this code, decides.)
    if (body.mode !== undefined) {
      if (typeof body.mode !== "string" || !VALID_MODES.includes(body.mode as CommitMode)) {
        return NextResponse.json<CommitResponse>(
          { ok: false, error: `Invalid mode. Expected one of: ${VALID_MODES.join(", ")}.` },
          { status: 400 },
        );
      }
      mode = body.mode as CommitMode;
    }

    const { byName, byId } = await parties();
    // The AGENT acts — agent-only token. The whole point is the ledger, not the
    // agent, enforces the mandate.
    const agentTok = mintToken([byName["BuyerAgent"]]);

    const mandates = await query<MandatePayload>(agentTok, [TID.mandate]);
    if (!mandates.length) {
      return NextResponse.json<CommitResponse>({ ok: false, error: "No active mandate. Issue one first." }, { status: 400 });
    }
    const mandate = mandates[0];
    const cap = Number(mandate.payload.perTxCap);
    const approved = new Set(mandate.payload.approvedSuppliers);

    const quotes = await query<QuotePayload>(agentTok, [TID.quote]);
    const cash = await query<IouPayload>(agentTok, [TID.iou]);

    let quote;
    if (mode === "overcap") {
      quote = quotes.find((q) => Number(q.payload.price) > cap);
    } else if (mode === "offlist") {
      quote = quotes.find((q) => !approved.has(q.payload.supplier));
    } else {
      quote = quotes
        .filter(
          (q) =>
            approved.has(q.payload.supplier) &&
            q.payload.category === mandate.payload.category &&
            Number(q.payload.price) <= cap,
        )
        .sort((a, b) => Number(a.payload.price) - Number(b.payload.price))[0];
    }

    if (!quote) {
      return NextResponse.json<CommitResponse>({ ok: false, error: `No ${mode} quote available.` }, { status: 400 });
    }

    const fund =
      [...cash]
        .sort((a, b) => Number(b.payload.amount) - Number(a.payload.amount))
        .find((c) => Number(c.payload.amount) >= Number(quote!.payload.price)) ?? cash[0];
    if (!fund) {
      return NextResponse.json<CommitResponse>({ ok: false, error: "No funded treasury Iou visible." }, { status: 400 });
    }

    const agentNote =
      mode === "cheapest"
        ? "Selected the cheapest compliant supplier within budget."
        : mode === "overcap"
          ? "Attempted the lowest over-cap quote to test the limit."
          : "Attempted an off-allow-list supplier to test the limit.";

    try {
      await exercise(agentTok, TID.mandate, mandate.contractId, "Commit", {
        quoteCid: quote.contractId,
        amount: quote.payload.price,
        cashCid: fund.contractId,
        agentNote,
      });
      return NextResponse.json<CommitResponse>({
        ok: true,
        mode,
        supplier: byId[quote.payload.supplier] ?? quote.payload.supplier.split("::")[0],
        amount: quote.payload.price,
      });
    } catch (e) {
      // A ledger-side precondition failure is the expected "money-shot" for the
      // negative modes — surface the raw Daml assertion message.
      const msg = e instanceof Error ? e.message : String(e);
      return NextResponse.json<CommitResponse>({ ok: false, rejected: true, mode, reason: ledgerReason(msg) });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json<CommitResponse>({ ok: false, error: msg }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { TID, mintToken, query, exercise, parties } from "@/app/lib/daml";
import type { MandatePayload } from "@/app/lib/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { byName } = await parties();
    const treasurerTok = mintToken([byName["Treasurer"]]);
    const mandates = await query<MandatePayload>(treasurerTok, [TID.mandate]);
    if (!mandates.length) {
      return NextResponse.json({ ok: false, error: "No active mandate to revoke." }, { status: 400 });
    }
    // Revoke every active mandate (defensive — there should be exactly one).
    // Revoke now emits an audited RevocationRecord (who/why), so it takes a reason.
    let reason = "Treasurer kill-switch — mandate revoked from the console.";
    try {
      const body = (await request.json()) as { reason?: string };
      if (body?.reason && body.reason.trim()) reason = body.reason.trim().slice(0, 200);
    } catch {
      // no body — use the default reason
    }
    for (const m of mandates) {
      await exercise(treasurerTok, TID.mandate, m.contractId, "Revoke", { reason });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

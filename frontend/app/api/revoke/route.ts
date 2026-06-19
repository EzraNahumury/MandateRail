import { NextResponse } from "next/server";
import { TID, mintToken, query, exercise, parties } from "@/app/lib/daml";
import type { MandatePayload } from "@/app/lib/types";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const { byName } = await parties();
    const treasurerTok = mintToken([byName["Treasurer"]]);
    const mandates = await query<MandatePayload>(treasurerTok, [TID.mandate]);
    if (!mandates.length) {
      return NextResponse.json({ ok: false, error: "No active mandate to revoke." }, { status: 400 });
    }
    // Revoke every active mandate (defensive — there should be exactly one).
    for (const m of mandates) {
      await exercise(treasurerTok, TID.mandate, m.contractId, "Revoke", {});
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

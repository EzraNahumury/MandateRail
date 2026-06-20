import { NextResponse } from "next/server";
import { TID, mintToken, query, exercise, create, parties } from "@/app/lib/daml";

export const dynamic = "force-dynamic";

// Resets the demo to a clean, known state: archives every app contract, then
// re-funds the treasury, issues a fresh mandate, and seeds the sealed quotes
// (including one over-cap and one off-allow-list quote for the negative paths).
//
// Setup legitimately involves several parties (bank funds, treasurer issues,
// suppliers quote), so it uses a multi-party "back-office" token. The agent
// flow (/api/commit) deliberately does NOT — there the ledger must enforce.
export async function POST() {
  try {
    const { byName } = await parties();
    const ids = Object.values(byName);
    const omni = mintToken(ids);

    // 1) Archive every existing app contract.
    for (const tid of [TID.mandate, TID.quote, TID.po, TID.iou, TID.audit, TID.charter, TID.approval, TID.revocation]) {
      const contracts = await query<unknown>(omni, [tid]);
      for (const c of contracts) {
        try {
          await exercise(omni, tid, c.contractId, "Archive", {});
        } catch {
          // ignore — best-effort cleanup
        }
      }
    }

    const T = byName["Treasurer"];
    const A = byName["BuyerAgent"];
    const B = byName["Bank"];
    const sA = byName["SupplierA"];
    const sB = byName["SupplierB"];
    const sC = byName["SupplierC"];
    const sD = byName["SupplierD"];
    const R = byName["Regulator"];
    const CEO = byName["CEO"];
    const CFO = byName["CFO"];
    const category = "cloud-compute";
    const expiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    // 2) Fund the treasury, earmarked (disclosed) to the agent.
    await create(omni, TID.iou, { bank: B, owner: T, amount: "50000.0", observers: [A] });

    // 3) LAYER 1 — the CEO + CFO charter (multi-sig) with absolute ceilings.
    const charter = (await create(omni, TID.charter, {
      ceo: CEO,
      cfo: CFO,
      treasurer: T,
      regulator: R,
      ceilingPerTxCap: "15000.0",
      ceilingBudget: "100000.0",
    })) as { contractId: string };

    // 4) LAYER 2 — the treasurer mints an operational mandate WITHIN the ceilings
    //    (tighten-only, enforced by the ledger). regulator is a field, NOT an
    //    observer — it only sees the PurchaseOrder + AuditRecord, never the cap.
    await exercise(omni, TID.charter, charter.contractId, "MintMandate", {
      agent: A,
      bank: B,
      mandateId: "MANDATE-2026-001",
      category,
      perTxCap: "10000.0",
      remainingBudget: "50000.0",
      expiry,
      approvedSuppliers: [sA, sB, sC],
      allowAutoCommit: true,
    });

    // 4) Seal the quotes.
    const quote = (supplier: string, price: string) =>
      create(omni, TID.quote, { supplier, agent: A, category, price });
    await quote(sA, "9000.0");
    await quote(sB, "9500.0");
    await quote(sC, "9200.0");
    await quote(sD, "9000.0"); // off-allow-list
    await quote(sC, "12000.0"); // over per-tx cap

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

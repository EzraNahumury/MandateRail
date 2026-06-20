import { NextResponse } from "next/server";
import { TID, mintToken, query, parties } from "@/app/lib/daml";
import type { AuditPayload, RevocationPayload } from "@/app/lib/types";

export const dynamic = "force-dynamic";

// Read-only audit statement for a controller/auditor: every authorized spend with
// its five ledger verdicts + the human-approval flag, plus the revocation log.
// This is the tangible, hand-to-your-auditor artifact behind "regulator-observable
// audit" — derived live from the AuditRecord/RevocationRecord contracts, no Daml
// change, privacy model untouched (the regulator never sees cap/budget here either).
const COLS = [
  "committedAt",
  "mandateId",
  "category",
  "supplier",
  "amount",
  "underPerTxCap",
  "underBudget",
  "supplierApproved",
  "categoryMatch",
  "notExpired",
  "humanApproved",
  "agentNote",
] as const;

const csvCell = (v: unknown) => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export async function GET(request: Request) {
  try {
    const { byName, byId } = await parties();
    const label = (id: string) => byId[id] ?? id.split("::")[0];
    const regTok = mintToken([byName["Regulator"]]);

    const audits = await query<AuditPayload>(regTok, [TID.audit]);
    const revs = await query<RevocationPayload>(regTok, [TID.revocation]);

    const rows = audits
      .map((a) => a.payload)
      .sort((a, b) => a.committedAt.localeCompare(b.committedAt))
      .map((a) => ({
        committedAt: a.committedAt,
        mandateId: a.mandateId,
        category: a.category,
        supplier: label(a.supplier),
        amount: a.amount,
        underPerTxCap: a.underPerTxCap,
        underBudget: a.underBudget,
        supplierApproved: a.supplierApproved,
        categoryMatch: a.categoryMatch,
        notExpired: a.notExpired,
        humanApproved: a.humanApproved,
        agentNote: a.agentNote,
      }));

    const revocations = revs
      .map((r) => r.payload)
      .sort((a, b) => a.at.localeCompare(b.at))
      .map((r) => ({ at: r.at, mandateId: r.mandateId, revokedBy: label(r.revokedBy), role: r.role, reason: r.reason }));

    const url = new URL(request.url);
    if (url.searchParams.get("format") === "json") {
      return NextResponse.json({ generatedAt: rows.at(-1)?.committedAt ?? null, commits: rows, revocations });
    }

    const header = COLS.join(",");
    const body = rows.map((r) => COLS.map((c) => csvCell(r[c])).join(",")).join("\n");
    const revBlock = revocations.length
      ? "\n\n# Revocations\nat,mandateId,revokedBy,role,reason\n" +
        revocations.map((r) => [r.at, r.mandateId, r.revokedBy, r.role, r.reason].map(csvCell).join(",")).join("\n")
      : "";
    const csv = `# MandateRail audit statement — on-chain AuditRecord verdicts\n${header}\n${body}${revBlock}\n`;

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="mandaterail-audit-statement.csv"',
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

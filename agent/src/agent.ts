import Ledger, { CreateEvent } from "@daml/ledger";
import { ContractId } from "@daml/types";
import { SpendMandate } from "@daml.js/mandaterail-1.0.0/lib/MandateRail/Mandate";
import { RfqQuote } from "@daml.js/mandaterail-1.0.0/lib/MandateRail/Rfq";
import { Iou } from "@daml.js/mandaterail-1.0.0/lib/MandateRail/Cash";

import { LEDGER_URL, adminToken, tokenFor } from "./config";
import { describeIntent } from "./intent";

const num = (s: string) => Number(s);
const short = (p: string) => p.split("::")[0];

/** Discover the BuyerAgent party id from the ledger (no hard-coding). */
async function findAgentParty(): Promise<string> {
  const admin = new Ledger({ token: adminToken(), httpBaseUrl: LEDGER_URL });
  const parties = await admin.listKnownParties();
  const agent = parties.find(
    (p) => p.displayName === "BuyerAgent" || p.identifier.startsWith("BuyerAgent"),
  );
  if (!agent) {
    throw new Error(
      "Party 'BuyerAgent' not found. Is `daml start` running with the Bootstrap init-script?",
    );
  }
  return agent.identifier;
}

function logQuote(label: string, q: CreateEvent<RfqQuote>): void {
  console.log(`     - ${label}: supplier=${short(q.payload.supplier)} price=${q.payload.price}`);
}

/** Pick the largest treasury Iou the agent can see that covers `amount`. */
function pickFund(cashes: CreateEvent<Iou>[], amount: number): CreateEvent<Iou> | undefined {
  return [...cashes]
    .sort((a, b) => num(b.payload.amount) - num(a.payload.amount))
    .find((c) => num(c.payload.amount) >= amount);
}

/** Attempt a Commit and assert it matches the expected outcome. */
async function tryCommit(
  ledger: Ledger,
  mandateCid: ContractId<SpendMandate>,
  quote: CreateEvent<RfqQuote>,
  cashCid: ContractId<Iou>,
  expect: "ok" | "reject",
): Promise<void> {
  try {
    const [result] = await ledger.exercise(SpendMandate.Commit, mandateCid, {
      quoteCid: quote.contractId,
      amount: quote.payload.price,
      cashCid,
    });
    if (expect === "reject") {
      console.error("   ✗ UNEXPECTED: commit succeeded but should have been rejected.");
      process.exitCode = 1;
    } else {
      console.log("   ✓ COMMIT OK — mandate debited + PO issued + cash settled, atomically.");
      console.log(`     result: ${JSON.stringify(result)}`);
    }
  } catch (err: any) {
    const msg = String(err?.errors?.join("; ") ?? err?.message ?? err).slice(0, 300);
    if (expect === "reject") {
      console.log(`   ✓ REJECTED BY THE LEDGER (not app code): ${msg}`);
    } else {
      console.error(`   ✗ UNEXPECTED rejection: ${msg}`);
      process.exitCode = 1;
    }
  }
}

async function main(): Promise<void> {
  console.log("MandateRail buyer agent — the ledger, not the model, is the guardrail.\n");

  const agentParty = await findAgentParty();
  const ledger = new Ledger({ token: tokenFor(agentParty), httpBaseUrl: LEDGER_URL });

  const mandates = await ledger.query(SpendMandate);
  if (mandates.length === 0) throw new Error("No SpendMandate visible to the agent.");
  let mandate = mandates[0];
  const { category, perTxCap, remainingBudget, approvedSuppliers } = mandate.payload;

  console.log(describeIntent(category, remainingBudget));
  console.log(`\nMandate: category=${category} perTxCap=${perTxCap} remaining=${remainingBudget}`);
  console.log(`Approved suppliers: ${approvedSuppliers.map(short).join(", ")}\n`);

  const quotes = await ledger.query(RfqQuote);
  console.log("Sealed quotes visible to the agent (it runs the auction):");
  quotes.forEach((q) => logQuote("quote", q));

  const cap = num(perTxCap);
  const remaining = num(remainingBudget);
  const approved = new Set(approvedSuppliers);

  const compliant = quotes
    .filter((q) => q.payload.category === category)
    .filter((q) => approved.has(q.payload.supplier))
    .filter((q) => num(q.payload.price) <= cap && num(q.payload.price) <= remaining)
    .sort((a, b) => num(a.payload.price) - num(b.payload.price));

  // 1) HAPPY PATH — award the cheapest compliant quote.
  console.log("\n[1] Awarding the cheapest compliant quote ...");
  if (compliant.length === 0) throw new Error("No compliant quote found.");
  const winner = compliant[0];
  const cash1 = await ledger.query(Iou);
  const fund = pickFund(cash1, num(winner.payload.price));
  if (!fund) throw new Error("No funded treasury Iou visible to the agent.");
  logQuote("winner", winner);
  await tryCommit(ledger, mandate.contractId, winner, fund.contractId, "ok");

  // The mandate was archived + recreated with reduced budget.
  mandate = (await ledger.query(SpendMandate))[0];
  console.log(`    remaining budget now: ${mandate.payload.remainingBudget}`);

  // 2) NEGATIVE PATH — over the per-tx cap.
  console.log("\n[2] Money-shot #1a — trying an OVER-CAP purchase ...");
  const overCap = quotes.find((q) => num(q.payload.price) > cap);
  if (overCap) {
    const cash2 = await ledger.query(Iou);
    const f = pickFund(cash2, num(overCap.payload.price)) ?? cash2[0];
    logQuote("over-cap quote", overCap);
    await tryCommit(ledger, mandate.contractId, overCap, f.contractId, "reject");
  } else {
    console.log("   (no over-cap quote seeded; skipped)");
  }

  // 3) NEGATIVE PATH — supplier not on the allow-list.
  console.log("\n[3] Money-shot #1b — trying an OFF-ALLOW-LIST supplier ...");
  const offList = quotes.find((q) => !approved.has(q.payload.supplier));
  if (offList) {
    const cash3 = await ledger.query(Iou);
    const f = pickFund(cash3, num(offList.payload.price)) ?? cash3[0];
    logQuote("off-list quote", offList);
    await tryCommit(ledger, mandate.contractId, offList, f.contractId, "reject");
  } else {
    console.log("   (no off-list quote seeded; skipped)");
  }

  console.log(
    "\nDone. The agent could only do what the mandate encoded. Trust the ledger, not the model.",
  );
}

main().catch((e: unknown) => {
  console.error("\nAgent failed:", (e as Error)?.message ?? e);
  process.exit(1);
});

// The "intent" layer is PRESENTATION ONLY and has ZERO enforcement authority.
// All control lives in the Daml ledger — swap this for any LLM (e.g. Ollama Cloud)
// and the ledger guarantees are unchanged. This is the deliberate inversion of
// the "AI wrapper": the model never decides what is allowed; the ledger does.

export function describeIntent(category: string, remainingBudget: string): string {
  return (
    `Intent: procure "${category}" within the remaining mandate budget of ${remainingBudget}. ` +
    `Strategy: award the cheapest compliant supplier. ` +
    `Note: anything off-policy will be rejected by the ledger, not by me.`
  );
}

# MandateRail — Submission

**Confidential, ledger-enforced spend mandates for agentic procurement on Canton.**

> Trust the ledger, not the model. Spend mandates that AI agents *physically cannot* break.

| | |
|---|---|
| **Repository** | https://github.com/EzraNahumury/MandateRail |
| **Live demo** | **https://mandate-rail.vercel.app** — open [`/demo?role=cockpit`](https://mandate-rail.vercel.app/demo?role=cockpit). Read-only UI on a **captured real ledger snapshot**; the full interactive ledger runs locally per the walkthrough below. |
| **Video (3 min)** | _TBD — add link before submission_ |
| **Deck** | [Presentation deck (PDF)](https://drive.google.com/file/d/1jDnMEZr1rQf_xshU0BuoAaZihfJmbrXp/view?usp=sharing) · source [`PITCH_DECK.md`](PITCH_DECK.md) |
| **Event** | Build on Canton Hackathon — Canton Foundation, June 2026 |
| **Track** | 3 — Payments, Neobanking & Agentic Commerce (touches Track 1 privacy) |

---

## One-line pitch

A treasurer issues a Daml `SpendMandate` to an AI buyer agent; every spending limit is enforced as a **ledger precondition**, so an over-budget or off-policy purchase is rejected **by Canton, not by trusting a prompt** — while the company's budget and negotiated prices stay private to the treasurer.

---

## The problem

Enterprises want AI agents to buy routine inputs autonomously (cloud, freight, ad inventory, commodities). Treasury says **no**, for two unsolved reasons:

1. **Authority is off-ledger and unverifiable.** Today an agent's spending limit is a spreadsheet plus an API key — **no settlement-level guarantee** that a buggy, jailbroken, or prompt-injected agent can *only* act within its mandate, and **no tamper-proof trail** of what it committed the company to. A single prompt-injection can authorize a payment the company is legally on the hook for.
2. **Budget & price leakage.** To transact, the agent must prove authority to a supplier — but exposing the cap, remaining headroom, and negotiated price means every supplier **prices to the cap** and supplier-side agents **collude** in reverse auctions.

So the buyer is forced to choose between an agent that *can't prove its authority* and one that *leaks its crown-jewel commercial position*. Procurement stays stuck on PDFs, API keys, and disputed invoices.

---

## The insight

**Move the guardrail off the AI model and onto the Canton ledger.** Enforcement lives in Daml **choice preconditions** (`assertMsg`), not in app code and not in a prompt. The agent is intentionally *powerless*: it cannot exceed its **encoded** mandate (amount, supplier, category, expiry) — a far stronger property than an AI safety layer. In-policy discretion (which compliant supplier, what price within cap) remains the agent's, by design. This is the deliberate **inversion** of the "AI wrapper" trope: Canton, not the model, is the enforcement layer.

---

## Three-layer authority

Authority flows **down**; each layer can only tighten the one above it.

1. **`TreasuryCharter`** — CEO + CFO multi-sig set absolute ceilings; `MintMandate` is **tighten-only**; either signatory can `RevokeByCharter` to cascade-kill.
2. **`SpendMandate`** — the treasurer issues an operational mandate **within** those ceilings (category, per-tx cap, cumulative budget, expiry, approved-supplier allow-list).
3. **Buyer Agent** — spends **only within** the encoded mandate; can *never* over-spend. When an over-cap buy is genuinely needed it raises an `ApprovalRequest` only the treasurer can `Approve`.

---

## Key innovations

- **Ledger-enforced policy** — per-tx cap + cumulative budget + expiry + supplier allow-list, all enforced as Daml choice preconditions, not app logic.
- **Sealed-bid RFQ** — each supplier's `RfqQuote` is observed only by the buyer agent; **rivals are never observers** → no collusion, no price-to-cap.
- **True DvP (escrow until delivery)** — one atomic `Commit` debits the mandate, mints a `FUNDED_PENDING_DELIVERY` `PurchaseOrder`, and **locks** the payment in bank-held escrow (the supplier is assured of funds, not yet paid) + emits an `AuditRecord`. `ConfirmReceipt` releases the escrow to the supplier only on confirmed delivery → `SETTLED`. No paid-but-undelivered state is reachable — proven by `testDeliveryReleasesPayment`.
- **No bare purchase orders** — `RfqQuote.Accept` requires the treasurer's authority (in scope only inside a real, budget-debiting `Commit`), so the agent can never mint a funded PO out of band (`testNoBarePurchaseOrder`).
- **Visible governance** — a `CharterProposal` from the CEO that only the CFO can `AcceptByCfo` makes the multi-sig a real two-party act; one charter mints a portfolio of mandates across categories (`testCharterGovernance`, `testCharterPortfolio`).
- **Human-in-the-loop escalation** — the agent alone can *never* authorize an override; only the treasurer's `Approve` settles a single over-cap buy via `CommitApproved`, audited honestly (`humanApproved = true`, `underPerTxCap = false`).
- **Instant `Revoke`** — the treasurer archives the mandate; the agent's next buy fails immediately, leaving an audited `RevocationRecord` (who/why, regulator-visible).
- **`allowAutoCommit` capability dial** — a mandate can be minted *escalate-only*.
- **`DryRunCommit`** — a nonconsuming pre-flight returning the **ledger's own verdicts** before committing.
- **Selective disclosure** — a real regulator party observes `PurchaseOrder` + `AuditRecord` + `RevocationRecord`, but **never** the `SpendMandate` cap/budget or the sealed quotes.
- **Real LLM, ledger-gated** — a genuine **Ollama Cloud** (`gpt-oss:120b`) call chooses among the *already-compliant* quotes and writes an on-chain rationale; its output is whitelist-validated and the ledger **still** re-checks every rule. A hallucinated or jailbroken pick is rejected by a Daml precondition — the model advises, the ledger decides. (Runs deterministically with no key.)
- **Adversarial-proven** — a prompt-injection string in `agentNote` rides an over-cap `Commit` and is still **inert**: the ledger rejects it regardless.

---

## Why only Canton

Both load-bearing Canton capabilities are **required** — remove either and the product fails.

| Need | Canton capability | On a transparent chain / SaaS DB |
|---|---|---|
| Supplier validates an amount against a cap it can **never see** | Sub-transaction privacy (signatory/observer scoping) | Cap & prices leak to mempool → instant price-to-cap |
| Mandate debit + binding PO + cash settle commit indivisibly | Atomic multi-party settlement (DvP) | Agent can reach paid-but-undelivered / half-spent state |
| Buyer & independent supplier (no shared operator) trust the same atomic settlement + audit slice | Cross-party non-repudiable commit + per-party need-to-know projection | A single-operator DB is "trust our backend" |
| The mandate itself is an enforceable on-ledger **right** | Daml signatory authority | A row in a table, not a right |

---

## Tracks covered

- **Agentic commerce with privacy** — autonomous buyer agent under bounded, private delegation.
- **Treasury / business-banking workflows** — issue, monitor live consumption, escalate, revoke.
- **Systems where software agents safely initiate commercial actions** — the agent is structurally incapable of exceeding authority.

---

## Mapping to the judging criteria

| Criterion | Where MandateRail earns it |
|---|---|
| **Technical execution** | 9 Daml templates; **21 ledger tests** incl. an adversarial suite; clean BFF + typed UI; green production build + CI. Enforcement lives in the contract, proven by `submitMustFail`. |
| **Originality** | "Trust the ledger, not the model" — a real LLM whose every hallucination is *provably rejected* by the ledger; sealed-bid RFQ + selective disclosure to a regulator. |
| **User experience & design** | One-click **▶ Play full demo** autopilot, live budget gauge, the red "REJECTED BY THE LEDGER" money-shot, per-party sign-in, and the supplier **"Mandate & budget: NOT VISIBLE"** privacy proof — all live, no mock data. |
| **Real-world applicability** | A genuine treasury problem (agentic procurement) with CEO+CFO charter governance, instant revoke, and a downloadable on-chain **audit statement** an auditor could actually use. |

---

## Tech stack

- **Smart contracts:** Daml SDK **2.10.4** (Canton sandbox) — 10 templates: `CharterProposal`, `TreasuryCharter`, `SpendMandate`, `RfqQuote`, `PurchaseOrder` (escrow lifecycle), `Iou` (escrow-capable), `ApprovalRequest`, `AuditRecord`, `RevocationRecord` (+ `CommitResult` / verdict data types).
- **Tests:** **25 Daml Script tests, all passing** — happy path, over-cap/over-budget/off-allow-list/expiry rejects, sealed-bid privacy, concurrent-commit race, audited revoke, regulator selective disclosure, charter tighten-only & revoke cascade, escalation approve/reject, plus an adversarial suite (`testPromptInjectionInAgentNoteIsInert`, `testForgedAmountRejected`, `testAgentCannotSelfApprove`, `testNoAutoCommitMandate`, `testIssuanceInvariant`, `testRevocationAudited`, `testDryRunVerdicts`).
- **Frontend:** **Next.js 16 + React 19 + Tailwind v4** backend-for-frontend — route handlers proxy the Daml JSON Ledger API; per-party JWTs minted server-side via `node:crypto`.
- **Agent:** **TypeScript** buyer agent with a real **Ollama Cloud** (`gpt-oss:120b`) reasoning step — thin by design, **zero enforcement authority** (the ledger gates every decision; deterministic fallback when no LLM key).
- **UI:** light-theme landing page (`/`) + cockpit (`/demo`) with per-party sign-in and four live panels (Treasurer, Buyer Agent, Supplier A, Regulator/Auditor) + a live spend-analytics strip (budget burndown, per-tx-vs-cap bars, commit timeline) — all derived live from the on-chain audit trail, no mock data.

---

## Self-serve demo walkthrough (reproduce without the video)

Start the ledger (`daml start`) and the UI (`cd frontend && npm run dev` → `http://localhost:3000`); open `/demo`.

> **Fastest path:** choose **View all parties · cockpit** and click **▶ Play full demo** — an autopilot drives the entire story below (issue → commit → over-cap & off-list rejections → escalate → approve → revoke) in ~10 seconds, every beat live on the ledger. The manual walkthrough:

1. **Issue the mandate.** As **Treasurer**, issue a `SpendMandate` to BuyerAgent: cloud-compute, **$50,000** cumulative, **$10,000/tx**, suppliers **A/B/C**, 30-day expiry. The agent gauge reads **$0 / $50,000**. *(These are not app settings — they are enforced inside the Daml contract.)*
2. **Sealed RFQ.** As **Buyer Agent**, open the RFQ; A/B/C each submit a private `RfqQuote`. Flip to Supplier A and B: **A cannot see B's price; no supplier can see the cap.**
3. **Award Supplier A @ $9,000 → `Commit`.** In **one atomic transaction** the gauge moves to **$9k / $50k**, a `PurchaseOrder` appears, the payment is **locked in bank-held escrow**, and an `AuditRecord` is emitted. A's panel reads **⏳ Funded · awaiting delivery** (cash assured, not yet paid) — showing **nothing** about the remaining $41,000.
   - **Confirm receipt → SETTLED.** Click **Confirm receipt**; the escrow releases to Supplier A and the order flips to **✓ Settled · paid**. True DvP: the supplier is paid only on delivery (`testDeliveryReleasesPayment`).
4. **Try $12,000 (over-cap) → REJECTED.** Award an over-cap buy. The ledger rejects it via `assertMsg "amount exceeds per-tx cap"` — **a real Daml precondition failure, not app code.** Nothing debited, no PO, no payment.
5. **Try off-list supplier D → REJECTED.** Award supplier D. Same hard rejection: `assertMsg "supplier not on allow-list"`.
6. **Escalate + approve the over-cap buy.** As Buyer Agent, raise an `ApprovalRequest` for the $12,000 spend. As **Treasurer**, `Approve` it → `CommitApproved` settles the single override, audited `humanApproved = true`, `underPerTxCap = false` (honest). *(The agent alone could never authorize this.)*
7. **Revoke.** As **Treasurer**, click **Revoke**. The mandate is archived and a `RevocationRecord` (who/why) is written. The agent's next compliant `Commit` fails instantly — its input contract no longer exists.
8. **Show the AuditRecord.** Open the **Regulator/Auditor** panel: it observes every `PurchaseOrder`, `AuditRecord`, and `RevocationRecord` — but **never** the `SpendMandate` cap/budget or the sealed quotes (selective disclosure, verified by `testRegulatorSelectiveDisclosure`).

> Prefer the command line? `daml test` runs all 21 ledger tests green — the same guarantees, proven deterministically.

---

## Team & contact

- **Owner:** EzraNahumury — ezranhmry@gmail.com
- **Repository:** https://github.com/EzraNahumury/MandateRail

---

<p align="center"><strong>Bounded. Private. Atomic.</strong><br/>Trust the ledger, not the model.</p>

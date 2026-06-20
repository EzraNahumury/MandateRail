# MandateRail — Pitch Deck Script

> Paste-into-slides outline (10 slides). Export to PDF from your slides tool.
> Repo: https://github.com/EzraNahumury/MandateRail · Contact: ezranhmry@gmail.com
> Track 3 — Payments, Neobanking & Agentic Commerce · Build on Canton (Canton Foundation, June 2026)

---

## Slide 1 — Title

### MandateRail — Bounded. Private. Atomic. Trust the ledger, not the model

- Confidential, ledger-enforced spend mandates for agentic procurement on Canton.
- Spend mandates that AI agents *physically cannot* break.
- Enforcement lives in Daml choice preconditions — not app code, not a prompt.
- Built on Canton Network · Smart contracts in Daml · Apache 2.0.

**Speaker note:** "We move the spending guardrail off the AI model and onto the Canton ledger."

---

## Slide 2 — The Problem

### Agentic procurement is stuck in pilot purgatory — two unsolved blockers

- **Authority is off-ledger and unverifiable:** an agent's spending limit today is an API key plus a spreadsheet of caps — no settlement-level guarantee a jailbroken agent can *only* act within mandate.
- A single prompt-injection or logic bug can authorize a payment the company is legally on the hook for — with no tamper-proof, non-repudiable trail.
- **Confidentiality & collusion:** to transact, the agent must prove authority — but exposing the cap, remaining headroom, and negotiated price means suppliers **price-to-cap** and supplier-side agents **collude**.
- The buyer is forced to choose: an agent that *can't prove its authority*, or one that *leaks its crown-jewel commercial position*.

**Speaker note:** "Treasury says no — and they're right to, because today's options are unsafe or self-defeating."

---

## Slide 3 — The Insight

### Authority belongs in the Daml contract, not the model

- MandateRail makes **delegated spend authority a ledger primitive** rather than an application convention.
- Every limit — per-tx cap, cumulative budget, expiry, supplier allow-list — is enforced as a **Daml choice precondition** (`assertMsg`), so an over-policy buy is rejected **by the ledger, not by trusting a prompt**.
- The agent is intentionally **powerless**: it cannot exceed its *encoded* mandate — a far stronger property than an AI safety layer.
- The deliberate **inversion** of the "AI wrapper" trope the track warns against: Canton, not the model, is the enforcement layer.

**Speaker note:** "Trust the ledger, not the model — that's the whole thesis on one line."

---

## Slide 4 — Three-Layer Authority

### CEO + CFO Charter → Mandate → Agent — tighten-only, all the way down

- **`TreasuryCharter`** (CEO + CFO multi-sig): sets absolute ceilings; either signatory can cascade-revoke.
- **`SpendMandate`**: the treasurer mints an operational mandate **within** those ceilings — `MintMandate` above a ceiling fails (**tighten-only**).
- **`BuyerAgent`**: spends only **within** the encoded mandate — and can *never* exceed the per-tx cap.
- **Human-in-the-loop:** when an over-cap buy is genuinely needed, the agent raises an `ApprovalRequest`; only the treasurer can `Approve` a single override (`CommitApproved`), audited honestly (`humanApproved = true`).
- Authority flows **down**; nobody downstream can loosen what's above them.

**Speaker note:** "Three signatory layers, each strictly tighter than the last — the agent inherits power, never grants it."

---

## Slide 5 — What the Agent Does

### Sealed RFQ → award lowest-compliant → atomic Commit

- **Source:** the agent opens a sealed-bid RFQ; suppliers A/B/C each submit a private `RfqQuote` — **no supplier sees another's price, none sees the cap**.
- **Award:** the agent picks the best compliant quote (e.g. A @ $9,000) and exercises `Commit`.
- **Commit (atomic DvP):** in **one transaction** the ledger checks every precondition, then debits the mandate, creates a binding `PurchaseOrder`, settles tokenized cash to the supplier, and emits an `AuditRecord`.
- The supplier's screen flips to **`Authorized + Funded`** — showing nothing about the remaining budget.
- In-policy discretion (which compliant supplier, what price within cap) stays the agent's — by design.

**Speaker note:** "One indivisible transaction: no half-spent mandate, no paid-but-undelivered state."

---

## Slide 6 — Money-Shot #1: The Ledger Says No

### Over-cap and off-list rejected by a precondition — prompt injection is inert

- Tell the agent to buy **$12,000** (over the per-tx cap) → `assertMsg "amount exceeds per-tx cap"` **fails at the ledger**. Nothing debited, no PO, no payment.
- Tell it to buy from non-approved **Supplier D** → `assertMsg "supplier not on allow-list"` **fails**. Same hard rejection.
- **Prompt injection is INERT:** a jailbreak string in `agentNote` rides an over-cap `Commit` and is *still* rejected — the malicious text never touches the precondition.
- These are raw Daml `AssertionFailed` errors from `SpendMandate.Commit` — **proof the guardrail is the ledger, not the agent**.

**Speaker note:** "The agent is structurally incapable of exceeding its mandate — this is settlement-level authority, not a prompt guardrail."

---

## Slide 7 — Money-Shot #2: Instant Revoke + Audit

### Treasurer archives the mandate; the agent's next buy fails immediately

- Treasurer clicks **Revoke** → the `SpendMandate` is archived (consuming choice).
- The agent's next `Commit` — even a fully compliant one — **fails immediately**: the input contract no longer exists on the ledger.
- The agent is powerless the instant authority is withdrawn.
- Every action leaves an **append-only** trail: immutable `AuditRecord` (verdicts *derived* from the ledger's own preconditions) + `RevocationRecord` (who / why), both regulator-visible — cap and budget never exposed.

**Speaker note:** "Kill switch plus a non-repudiable trail — the controller stays in command, live."

---

## Slide 8 — Why Only Canton

### Sub-tx privacy + atomic DvP + choice preconditions — remove any one and the product fails

- **Sub-transaction privacy *is* the commercial point:** the supplier validates `amount <= remainingBudget` against a cap it can **never see**. On a transparent chain the cap leaks into the mempool → suppliers price-to-cap instantly → product impossible.
- **Atomic DvP removes real risk:** mandate-debit + binding PO + cash reservation commit as **one indivisible transaction**, so a buggy or adversarial agent can never reach paid-but-not-delivered.
- **Choice preconditions** make the mandate an enforceable on-ledger *right*, not an app convention.
- **Not a database in disguise:** a single-operator DB can't give a buyer and an independent supplier — who share no trusted operator — cryptographic, non-repudiable, atomic cross-party settlement plus a trusted audit slice each.

**Speaker note:** "Both of Canton's load-bearing capabilities are required — this is its hard differentiator."

---

## Slide 9 — Tracks + Proof

### Track 3 fit — and 21 passing Daml tests prove it actually works

- **Track:** Payments, Neobanking & Agentic Commerce (touches Track 1 privacy themes) — *agentic commerce with privacy* + *treasury / business-banking workflows*.
- **21 Daml Script tests, ALL PASSING on SDK 2.10.4** (`daml test` green) — judge-facing evidence, deterministic.
- **Adversarial suite:** `testPromptInjectionInAgentNoteIsInert`, `testForgedAmountRejected`, `testAgentCannotSelfApprove`, `testNoAutoCommitMandate`, `testIssuanceInvariant`, `testRevocationAudited`, `testDryRunVerdicts`.
- **Core suite:** happy-path, over-cap / over-budget / off-list / expiry rejects, sealed-bid privacy, concurrent-commit race, audited revoke, regulator selective disclosure, charter tighten-only, charter revoke cascade, escalation approve/reject.
- **Live cockpit:** Treasurer / Buyer Agent / Supplier A / Regulator panels + spend-analytics strip — everything derived live from the on-chain audit trail, no mock data.

**Speaker note:** "Not a demo with an AI wrapper — a tested ledger model the judges can run."

---

## Slide 10 — Vision & Ask

### The default safety substrate for enterprise autonomous commerce on Canton

- **Phase 1 — Hardening:** multi-currency caps & DvP; scored / multi-round auctions; SOX-style audit export; nested mandates (CFO → controllers → agents).
- **Phase 2 — Agent integration:** SDK + Ledger-API adapters so existing procurement/FinOps agents can hold and exercise mandates; delivery oracles so POs settle against attested receipt.
- **Phase 3 — Network:** a shared procurement venue where many buyers and suppliers transact under mutual privacy; **Daml Finance** + a regulated tokenized-deposit issuer replaces the stub.
- **Phase 4 — Standardization:** publish `SpendMandate` as an **open Daml standard** for agentic spend authority.
- **The ask:** back MandateRail to make **bounded, private, tamper-proof delegation** the default for agentic procurement on Canton.

**Speaker note:** "Bounded. Private. Atomic. Trust the ledger, not the model — that's MandateRail on Canton."

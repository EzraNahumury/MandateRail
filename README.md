# MandateRail

[![CI](https://github.com/EzraNahumury/MandateRail/actions/workflows/ci.yml/badge.svg)](https://github.com/EzraNahumury/MandateRail/actions/workflows/ci.yml)

**Confidential, ledger-enforced spend mandates for agentic procurement on Canton.**

> Trust the ledger, not the model. Spend mandates that AI agents *physically cannot* break.

[![Built on Canton](https://img.shields.io/badge/Built%20on-Canton%20Network-0A2540)](https://canton.foundation/)
[![Smart Contracts: Daml](https://img.shields.io/badge/Smart%20Contracts-Daml-1B468D)](https://www.digitalasset.com/developers)
[![Frontend: Next.js](https://img.shields.io/badge/Frontend-Next.js%20BFF-000000)](https://nextjs.org/)
[![Agent: TypeScript](https://img.shields.io/badge/Agent-TypeScript-3178C6)](https://www.typescriptlang.org/)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-green)](#license)
[![Track: Payments, Neobanking & Agentic Commerce](https://img.shields.io/badge/Track-Agentic%20Commerce-purple)](#hackathon-context)
[![Judges: read SUBMISSION.md](https://img.shields.io/badge/Judges-read%20SUBMISSION.md-E63946)](SUBMISSION.md)
[![Pitch Deck](https://img.shields.io/badge/Pitch%20Deck-PITCH__DECK.md-FF6F61)](PITCH_DECK.md)

---

## TL;DR

Enterprises want AI agents to buy routine inputs autonomously (cloud, freight, ad inventory, commodities). Treasury says **no** — because today an agent's spending limit is a spreadsheet plus an API key (no settlement-level guarantee), and to transact at all the agent would **leak the company's budget and negotiated prices** to every supplier.

**MandateRail moves the guardrail off the AI model and onto the Canton ledger.** A treasurer issues a Daml `SpendMandate` to a named agent — category, per-transaction cap, cumulative budget, expiry, approved-supplier allow-list. Every limit is enforced as a **choice precondition**, so an over-budget or off-policy purchase is rejected **by the ledger, not by trusting a prompt**. Procurement runs as a **sealed-bid reverse auction** (suppliers can't see each other → no collusion, no price-to-cap), and on award a **single atomic transaction** debits the mandate, creates a binding purchase order, and settles tokenized cash (DvP). The supplier sees only an `Authorized + Funded` slice — the cap and remaining budget stay private to the treasurer, who watches live consumption and can **revoke instantly**.

---

## Table of Contents

1. [Hackathon Context](#hackathon-context)
2. [Screenshots & Demo](#screenshots--demo)
3. [The Problem](#the-problem)
4. [The Solution](#the-solution)
5. [Why Canton (and only Canton)](#why-canton-and-only-canton)
6. [How It Works](#how-it-works)
7. [System Architecture](#system-architecture)
8. [Privacy & Visibility Model](#privacy--visibility-model)
9. [The Daml Contract Model](#the-daml-contract-model)
10. [Core Flows (Sequence Diagrams)](#core-flows-sequence-diagrams)
11. [Atomic Settlement & Data Flow](#atomic-settlement--data-flow)
12. [Tech Stack](#tech-stack)
13. [Repository Structure](#repository-structure)
14. [Getting Started](#getting-started)
15. [Configuration](#configuration)
16. [The 3-Minute Demo Script](#the-3-minute-demo-script)
17. [MVP Scope (In / Out)](#mvp-scope-in--out)
18. [Testing](#testing)
19. [Mapping to the Judging Criteria](#mapping-to-the-judging-criteria)
20. [Roadmap](#roadmap)
21. [Risks & Mitigations](#risks--mitigations)
22. [FAQ](#faq)
23. [Honest Scope & Disclaimers](#honest-scope--disclaimers)
24. [Submission Artifacts](#submission-artifacts)
25. [Team & Acknowledgements](#team--acknowledgements)
26. [License](#license)

---

## Hackathon Context

| | |
|---|---|
| **Event** | Build on Canton Hackathon — *Build institutional-grade financial applications on Canton Network* |
| **Supported by** | Canton Foundation |
| **Track** | 3 — Payments, Neobanking & Agentic Commerce (touches Track 1 privacy themes) |
| **Theme fit** | *Agentic commerce with privacy* · *Treasury / business banking workflows* · *Systems where software agents can initiate or coordinate commercial actions safely* |
| **What judges reward (per the brief)** | "Trust, reliability, and practical usefulness… real products people or businesses would actually use, **not just demos with an AI wrapper**." |

MandateRail is the deliberate **inversion** of the "AI wrapper" trope the track warns against: the agent is intentionally powerless, and Canton — not the model — is the enforcement layer.

**Themes spanned (a project may span tracks — this one genuinely does):**

| Brief theme (verbatim) | How MandateRail hits it |
|---|---|
| Track 3 — *"believable use of agents"* / *"treasury / business banking workflows"* | A real LLM buyer agent under a treasury-issued, ledger-enforced spend mandate |
| Track 1/2 — *"B2B marketplace with blind auctions"* | Sealed-bid RFQ: rivals are never observers, so no supplier sees another's price or the cap |
| Track 1 — *"Private DeFi / OTC… where pricing, counterparties or positions shouldn't be public"* | Confidential atomic DvP settlement with selective disclosure to a regulator |

---

## Screenshots & Demo

> 📹 **3-minute video pitch + demo:** _add link before submission_
> 🖥️ **Live product:** runs locally on a Canton sandbox — see [Getting Started](#getting-started). _public deploy + URL before submission_

**Landing**

![MandateRail landing](docs/diagrams/landing.png)

**The cockpit — Treasurer · Buyer Agent · Supplier, live on a Canton sandbox**

![Four-panel cockpit with live ledger data](docs/diagrams/demo-cockpit.png)

The Supplier panel proves the privacy claim *live*: **Mandate & budget: NOT VISIBLE** — the cap never reaches the supplier's node. In the Buyer Agent panel, **Commit cheapest** settles atomically while **Try over-cap** / **Try off-list** are rejected by the ledger (a real Daml precondition failure, not app code).

**Sign in — choose a Canton party (no browser wallet)**

![Sign in screen](docs/diagrams/demo-signin.png)

---

## The Problem

Agentic procurement is arriving fast, but enterprise treasury has **two unsolved blockers** that keep it stuck in pilot purgatory.

### 1. Authority is off-ledger and unverifiable
An agent's spending limits today live in an API key plus a spreadsheet of caps — or a human rubber-stamping each spend in Slack. There is:
- **No settlement-level guarantee** that a buggy, jailbroken, or prompt-injected agent can *only* act within its mandate.
- **No tamper-proof, non-repudiable trail** of what the agent committed the company to.

A single prompt-injection or logic bug can authorize a payment the company is legally on the hook for.

### 2. Confidentiality & collusion
To transact, an agent must prove to a supplier: *"I am authorized to commit my company to pay up to X for this category, right now."* But if it exposes the **budget cap, remaining headroom, negotiated price, and volume**, then:
- Every supplier prices right up to the cap → **price-to-cap**.
- Supplier-side agents **collude** in reverse auctions.

So the buyer is forced to choose between an agent that *can't prove its authority* and an agent that *leaks its crown-jewel commercial position*.

**Result:** procurement still runs on PDFs, API keys, monthly invoices, and disputed credits — and the productivity of autonomous buying stays locked up because nobody has made **bounded, private, tamper-proof delegation** a hard guarantee.

```mermaid
flowchart LR
    subgraph Today["Today - off-ledger authority"]
        A1[AI Agent] -->|API key + spreadsheet caps| B1[Supplier]
        A1 -.->|leaks budget and price| B1
        B1 -->|prices to cap / colludes| A1
        H1[Human] -->|manual Slack approvals| A1
    end
    subgraph Rail["MandateRail - ledger-enforced authority"]
        T2[Treasurer] -->|issues SpendMandate| L2[(Canton Ledger)]
        A2[AI Agent] -->|exercise Commit| L2
        L2 -->|precondition check| L2
        L2 -->|Authorized + Funded only| B2[Supplier]
        L2 -.->|cap and budget hidden| B2
    end
```

---

## The Solution

MandateRail makes **delegated spend authority a ledger primitive** rather than an application convention.

| Capability | What it does | Enforced by |
|---|---|---|
| **`SpendMandate`** | Category, per-tx cap, cumulative-budget cap, expiry, approved-supplier allow-list | **Daml choice preconditions** (`assertMsg`) — not app code, not a prompt |
| **Sealed-bid RFQ** | Each supplier's quote is visible only to that supplier and the buyer agent | **Daml observer scoping** — rivals are never observers |
| **Atomic `Commit`** | Debit mandate + create binding PO + settle tokenized cash — in **one transaction** | **Canton atomic multi-party settlement (DvP)** |
| **`Authorized + Funded` slice** | The supplier sees proof of authority + funding, nothing about the cap | **Sub-transaction privacy** |
| **Instant `Revoke`** | Treasurer archives the mandate; the agent's next action fails immediately | **Daml signatory authority** |
| **Multi-sig `TreasuryCharter`** | CEO + CFO set absolute ceilings; the treasurer can only mint *tighter* mandates, and either can cascade-revoke | **Daml multi-party signatory + choice preconditions** |
| **Human-in-the-loop escalation** | The agent can't over-spend, but can raise an `ApprovalRequest`; only the treasurer can `Approve` a single override, audited honestly | **Daml authority flow — agent alone can never authorize `CommitApproved`** |
| **On-chain `AuditRecord`** | Every commit emits an immutable record whose verdicts are *derived* from the ledger's own preconditions; regulator-observable, cap/budget omitted | **Canton projection / observer model** |

The guarantee: **the agent cannot exceed its *encoded* mandate** (amount, supplier, category, expiry) — a far stronger property than an AI safety layer or a prompt guardrail. The ledger bounds the blast radius to exactly what the treasurer authorized; in-policy discretion (which compliant supplier, what price within cap) remains the agent's, by design.

> **On "no collusion / no price-to-cap":** sealed bids remove the *ledger-level information channel* that enables in-auction collusion and pricing-to-cap. Out-of-band collusion between suppliers who already know each other is an orthogonal problem MandateRail does not claim to solve.

---

## Why Canton (and only Canton)

Both of Canton's load-bearing capabilities are **required** here — remove either and the product fails.

### Sub-transaction privacy *is* the commercial point
The supplier's acceptance flow must validate that the purchase amount is within the remaining budget **against a cap the supplier is not a stakeholder of and can never see**. That asymmetric need-to-know slice (supplier sees `Authorized + Funded`; treasurer sees the full cap and live consumption) is exactly Daml's signatory/observer model.

> On a **transparent chain**, the cap and every negotiated price leak into the mempool → suppliers price-to-cap instantly. The product is impossible.

### Atomic settlement removes real risk
An autonomous agent **amplifies** settlement risk. The mandate-debit, the binding `PurchaseOrder`, and the cash reservation must commit as **one indivisible transaction**, so a buggy or adversarial agent can never reach a *paid-but-not-delivered* or *half-spent-mandate* state.

### Not a database in disguise
A plain SaaS database could hide a cap from one party — but it **cannot** give a buyer and a supplier *who do not share a trusted operator* cryptographic, non-repudiable, atomic cross-party settlement plus a tamper-proof audit slice each party independently trusts. That combination (need-to-know privacy across parties + atomic multi-party commit + the mandate itself being an enforceable on-ledger right) **is Canton's hard differentiator**.

---

## How It Works

A plain-English walkthrough of one purchase, end to end:

1. **Issue.** The treasurer opens the console and issues a `SpendMandate` to `BuyerAgent`: *category = cloud-compute, cumulative cap = $50,000, per-tx cap = $10,000, 30-day expiry, approved suppliers = A / B / C*. The mandate materializes on the treasurer's node and (as observer) the agent's node. **No supplier ever sees it.**
2. **Source.** A need arises (top up compute). The agent opens a sealed-bid RFQ; suppliers A, B, C each submit a private `RfqQuote`. **No supplier can see another's price; none can see the cap.**
3. **Commit (atomic).** The agent picks the best compliant quote (say A @ $9,000) and exercises `Commit`. In **one transaction** the ledger checks every precondition, then: debits the mandate (→ $41,000 remaining), creates a binding `PurchaseOrder`, and transfers tokenized cash to A. A's screen flips to **`Authorized + Funded`** — showing nothing about the remaining $41,000.
4. **Guardrail (negative path).** The agent is told to buy $12,000 (over the per-tx cap) or from non-approved supplier D → the ledger **rejects** the `Commit` via a failed precondition. Nothing is debited, no PO, no payment.
5. **Revoke.** The treasurer clicks `Revoke`; the mandate is archived. The agent's next `Commit` fails immediately because the authority no longer exists on the ledger.
6. **Audit.** The treasurer (and a scoped auditor) reviews the append-only trail of every agent action — non-repudiable, with competitor pricing and the cap never exposed to parties without need-to-know.

---

## System Architecture

Four layers, with the **enforcement core in Daml** — everything above it is presentation.

```mermaid
flowchart TB
    subgraph L4["Layer 4 - UI (React + Vite)"]
        TUI[Treasurer Console<br/>issue / live gauge / revoke / audit]
        SUI[Supplier View<br/>Authorized + Funded only]
        AUI[Agent Activity Pane]
    end
    subgraph L3["Layer 3 - Agent (TypeScript, thin & scripted)"]
        AG[Buyer Agent loop<br/>reads quotes then exercises Commit<br/>optional LLM only phrases intent]
    end
    subgraph L2["Layer 2 - Integration"]
        API[Daml Ledger API<br/>JSON API + gRPC / streaming]
    end
    subgraph L1["Layer 1 - Daml Model - THE ENFORCEMENT CORE"]
        M[SpendMandate]
        Q[RfqQuote]
        PO[PurchaseOrder]
        IOU[Iou / tokenized cash]
    end
    subgraph CN["Canton Network - multi-participant topology"]
        PT[Treasurer node]
        PA[Agent node]
        PS[Supplier nodes A/B/C]
    end

    TUI --> API
    SUI --> API
    AUI --> API
    AG --> API
    API --> L1
    L1 --- CN
```

- **Layer 1 — Daml model:** where authority and privacy live. The `Commit` choice is the heart: it asserts the policy and performs the atomic settlement.
- **Layer 2 — Canton topology:** separate participant nodes for Treasurer, Agent, and each Supplier on a shared synchronizer. Sub-transaction privacy guarantees a supplier's node only ever receives contracts it is a stakeholder on.
- **Layer 3 — Agent:** a deliberately **thin** scripted loop. Security lives entirely in the ledger; the agent is visibly powerless to break the rules. (An LLM may phrase the "intent," but it has zero enforcement authority — this is the answer to the "AI wrapper" critique.)
- **Layer 4 — UI:** three party-scoped React views driven by Ledger API streaming, so state flips appear live and simultaneously across panes.

> **Topology honesty:** the MVP runs on a single local Canton sandbox participant, where privacy is enforced by Daml's **signatory/observer scoping** (each party's UI is JWT-scoped and only queries contracts it is a stakeholder on). The *cross-node* sub-transaction privacy guarantee — where a supplier's separate participant node never even receives the bytes of the cap — is the **production** deployment on multi-participant Canton + the Global Synchronizer. The privacy *model* is identical; only the deployment topology differs. See [Honest Scope](#honest-scope--disclaimers).

---

## Privacy & Visibility Model

The single most important diagram in this project: **who can see what.** This is what a transparent chain cannot reproduce.

```mermaid
flowchart LR
    subgraph Treasurer["Treasurer node"]
        t1[SpendMandate: cap + remaining VISIBLE]
        t2[PurchaseOrder VISIBLE]
        t3[Audit log VISIBLE]
    end
    subgraph Agent["Buyer Agent node"]
        a1[SpendMandate VISIBLE - observer]
        a2[All RfqQuotes VISIBLE - runs auction]
        a3[PurchaseOrder VISIBLE]
    end
    subgraph SupplierA["Supplier A node - winner"]
        s1[Own RfqQuote VISIBLE]
        s2[PurchaseOrder VISIBLE - Authorized+Funded]
        s3[cap / remaining HIDDEN]
        s4[rival quotes HIDDEN]
    end
    subgraph SupplierB["Supplier B node - losing"]
        b1[Own RfqQuote VISIBLE]
        b2[A's quote HIDDEN]
        b3[the award HIDDEN]
    end
```

### Visibility matrix

| Data | Treasurer | Buyer Agent | Winning Supplier | Other Suppliers | Regulator |
|---|:--:|:--:|:--:|:--:|:--:|
| `SpendMandate` cap & **remaining budget** | full | yes (observer) | no | no | **no** |
| Own `RfqQuote` (price) | no | yes | yes | no | no |
| **Rival** `RfqQuote` (price) | no | yes (runs auction) | no | no | no |
| `PurchaseOrder` (Authorized + Funded) | yes | yes | yes | no | **yes (observer)** |
| `AuditRecord` (verdicts + rationale, no cap/budget) | yes | yes | no | no | **yes (observer)** |
| Tokenized cash movement | yes | yes | yes (received) | no | no |
| Append-only action history | yes (own) | yes (own) | yes (own) | yes (own) | scoped read |

\* *The regulator is **live in the MVP**: a real party that observes every `PurchaseOrder` + `AuditRecord` but is deliberately **not** an observer of the `SpendMandate` or any `RfqQuote` — so the cap, remaining budget, and sealed bids never reach its node (selective disclosure). Verified by `testRegulatorSelectiveDisclosure`.*

> **Key insight:** the **buyer agent** sees all quotes because it *runs* the auction and chooses the winner — that is correct. The anti-collusion / anti-price-to-cap property is that **suppliers never see each other**, and **no supplier ever sees the cap**.

---

## The Daml Contract Model

> The snippets below are **illustrative** of the model and authorization design. The compiling source lives in [`/daml`](#repository-structure). Holdings/settlement in the hardened version use the **Daml Finance** library; the MVP uses a simplified `Iou` stub.

### Templates at a glance

```mermaid
classDiagram
    class SpendMandate {
        +Party treasurer
        +Party agent
        +Text category
        +Decimal perTxCap
        +Decimal remainingBudget
        +Time expiry
        +List~Party~ approvedSuppliers
        +Commit()
        +Revoke()
    }
    class RfqQuote {
        +Party supplier
        +Party agent
        +Text category
        +Decimal price
        +Time expiry
        +Accept()
    }
    class PurchaseOrder {
        +Party agent
        +Party supplier
        +Decimal amount
        +Text status
    }
    class Iou {
        +Party bank
        +Party owner
        +Decimal amount
        +Transfer()
    }
    class TreasuryCharter {
        +Party ceo
        +Party cfo
        +Decimal ceilingPerTxCap
        +Decimal ceilingBudget
        +MintMandate()
    }
    class ApprovalRequest {
        +Party agent
        +Party treasurer
        +Decimal amount
        +Text reason
        +Approve()
        +Reject()
    }
    class AuditRecord {
        +Party treasurer
        +Party regulator
        +Bool underPerTxCap
        +Bool humanApproved
        +Text agentNote
    }
    TreasuryCharter --> SpendMandate : MintMandate creates (tighten-only)
    SpendMandate --> RfqQuote : Commit exercises Accept
    RfqQuote --> PurchaseOrder : Accept creates
    SpendMandate --> Iou : Commit transfers
    SpendMandate --> AuditRecord : Commit emits
    ApprovalRequest --> SpendMandate : Approve exercises CommitApproved
```

**Three-layer authority + human-in-the-loop.** The `TreasuryCharter` (CEO + CFO multi-sig) sets absolute ceilings; the treasurer mints an operational `SpendMandate` **within** them (tighten-only); the agent spends **within** the mandate. The agent can *never* exceed the per-tx cap — but when an over-cap buy is genuinely needed it raises an `ApprovalRequest` that only the treasurer can `Approve`, committing a single override via `CommitApproved`, audited honestly (`underPerTxCap = false`, `humanApproved = true`). Either charter signatory can `RevokeByCharter` to cascade-kill the mandate.

**Stakeholders** — *Signatory* / *Observer* per template:

| Template | Signatory | Observer |
|---|---|---|
| `TreasuryCharter` | `ceo` + `cfo` (multi-sig) | `treasurer`, `regulator` |
| `SpendMandate` | `treasurer` | `agent`, `charterCeo`, `charterCfo` (suppliers + regulator excluded → cap is private) |
| `RfqQuote` | `supplier` | `agent` only (rivals excluded → sealed) |
| `PurchaseOrder` | `agent` + `supplier` | `regulator` |
| `Iou` (cash) | `bank` | `owner`, earmarked observers |
| `ApprovalRequest` | `agent` | `treasurer`, `regulator` |
| `AuditRecord` | `treasurer` + `agent` | `regulator` (cap/budget deliberately omitted) |
| `RevocationRecord` | the revoker (`treasurer` or `charterCeo`) | `regulator` (audited kill: who/why, no cap/budget) |

The `SpendMandate` also carries an `allowAutoCommit` capability dial (a mandate can be minted **escalate-only**, with zero autonomous spend) and exposes a nonconsuming **`DryRunCommit`** that returns the ledger's own pass/fail verdicts without spending — so the UI's rule-lights are sourced from the ledger, never re-implemented in app code. The over-cap override `CommitApproved` requires the treasurer's authority (the agent alone can never summon it).

### 1. `SpendMandate` — the enforcement core

```haskell
template SpendMandate
  with
    treasurer         : Party
    agent             : Party
    bank              : Party          -- cash issuer
    category          : Text
    perTxCap          : Decimal
    remainingBudget   : Decimal
    expiry            : Time
    approvedSuppliers : [Party]
  where
    signatory treasurer
    observer  agent                    -- suppliers are NOT observers -> cap is private

    -- Agent commits a compliant purchase. ATOMIC: policy check + debit + PO + cash settle.
    -- `choice` is CONSUMING by default: exercising Commit archives this SpendMandate and the
    -- body recreates it with reduced remainingBudget (this is the anti-race mechanism).
    -- `cashCid` MUST be an Iou owned by `treasurer`, so the owner-authority needed to Transfer
    -- it is in scope (treasurer authority flows from being this contract's signatory).
    choice Commit : CommitResult
      with
        quoteCid : ContractId RfqQuote
        amount   : Decimal
        cashCid  : ContractId Iou      -- a treasury-owned Iou
      controller agent
      do
        now   <- getTime
        quote <- fetch quoteCid

        -- LEDGER-ENFORCED POLICY (not app logic, not a prompt):
        assertMsg "amount exceeds per-tx cap"       (amount <= perTxCap)
        assertMsg "amount exceeds remaining budget" (amount <= remainingBudget)
        assertMsg "supplier not on allow-list"      (quote.supplier `elem` approvedSuppliers)
        assertMsg "category mismatch"               (quote.category == category)
        assertMsg "mandate expired"                 (now < expiry)
        assertMsg "amount must match quoted price"  (amount == quote.price)

        -- Bring in the supplier's authority via their standing sealed offer -> binding PO
        poCid <- exercise quoteCid Accept with buyerAgent = agent

        -- Settle tokenized cash. `cashCid` is treasury-owned, so owner-authority is in scope.
        -- Transfer returns (payeeIou, optional change back to treasury).
        (paidCash, _change) <- exercise cashCid Transfer with
                                 newOwner       = quote.supplier
                                 transferAmount = amount

        -- ARCHIVE-AND-RECREATE: contention-safe cumulative cap (see note below)
        newMandate <- create this with remainingBudget = remainingBudget - amount

        pure CommitResult with
          mandate       = newMandate
          purchaseOrder = poCid
          cash          = paidCash

    -- Instant kill switch. CONSUMING (default): archives the mandate, so the agent's next
    -- Commit fails because its input contract no longer exists on the ledger.
    choice Revoke : ()
      controller treasurer
      do pure ()

data CommitResult = CommitResult with
    mandate       : ContractId SpendMandate
    purchaseOrder : ContractId PurchaseOrder
    cash          : ContractId Iou
  deriving (Eq, Show)
```

**Why this is correct Daml (and why a sharp judge can't break it):**
- The supplier validating `amount <= remainingBudget` against a cap it can **never see** is textbook signatory/observer scoping. The supplier is not an observer of `SpendMandate`, so its node never receives the cap.
- Exercising `Commit` runs with the authority of the **controller (agent) + the contract's signatory (treasurer)**. This is Daml's core rule: *the consequences of an action are authorized by its actors plus the signatories of the contract the action is taken on.* That treasurer authority is what lets the same transaction move treasury-owned cash and recreate the (treasurer-signed) mandate.
- The **winning supplier's** authority enters the transaction only through `exercise quoteCid Accept` on the supplier-signed `RfqQuote` — a clean propose-and-accept, so the binding `PurchaseOrder` (signed by agent + supplier) is created legitimately.

> **Security note — propose/accept back-door (handled).** Because `Accept` lives on the supplier's quote and is agent-controllable, a buggy agent could in principle exercise it *outside* `Commit` to mint a `PurchaseOrder` without debiting the mandate. We close this three ways: (1) `Accept` is **consuming** on the `RfqQuote`, so a quote is single-use — no replay; (2) a bare `PurchaseOrder` is **economically inert** — the supplier only ships against a PO paired with the atomic cash settlement that `Commit` performs; (3) in the hardened design the quote's accept is gated to fire **only as a consequence of `Commit`** (the mandate cid is passed in and asserted), so no PO can exist without a corresponding budget debit. The MVP relies on (1)+(2); (3) is on the roadmap.

### 2. `RfqQuote` — sealed-bid privacy

```haskell
template RfqQuote
  with
    supplier : Party
    agent    : Party            -- the buyer agent: the SOLE observer
    category : Text
    price    : Decimal
    expiry   : Time
  where
    signatory supplier
    observer  agent             -- rivals are NEVER observers => sealed bids

    choice Accept : ContractId PurchaseOrder
      with buyerAgent : Party
      controller buyerAgent
      do
        create PurchaseOrder with
          agent    = buyerAgent
          supplier
          category
          amount   = price
          status   = "FUNDED_PENDING_DELIVERY"   -- funded into escrow, not yet paid
          escrow                                  -- handle to the bank-held escrowed payment
```

### 3. `PurchaseOrder` — the binding commitment + the DvP delivery leg

```haskell
template PurchaseOrder
  with
    agent    : Party
    supplier : Party
    category : Text
    amount   : Decimal
    status   : Text             -- "FUNDED_PENDING_DELIVERY" | "SETTLED"
    escrow   : ContractId Iou   -- bank-held escrowed payment, released on receipt
  where
    signatory agent, supplier   -- the supplier's need-to-know slice: proves authority + funding,
                                -- contains NOTHING about the cap or remaining budget
    -- ConfirmReceipt (controller agent) releases the escrow to the supplier and
    -- flips status to SETTLED — the supplier is paid only on confirmed delivery.
```

### 4. `Iou` — tokenized-cash stub (DvP leg)

```haskell
template Iou
  with
    bank      : Party
    owner     : Party
    amount    : Decimal
    observers : [Party]      -- explicit-disclosure list (earmarking)
  where
    signatory bank
    observer  owner, observers

    -- Simplified for the MVP. The hardened version uses Daml Finance holdings.
    -- Returns (Iou for the payee, optional change Iou back to the sender) so funds are
    -- conserved. The recreated Iou keeps `bank` as signatory: exercising a choice on the
    -- bank-signed Iou contributes the bank's authority, so the new Iou is authorized.
    choice Transfer : (ContractId Iou, Optional (ContractId Iou))
      with
        newOwner       : Party
        transferAmount : Decimal
      controller owner
      do
        assertMsg "insufficient funds" (transferAmount <= amount)
        paid   <- create this with owner = newOwner, amount = transferAmount, observers = []
        change <- if transferAmount < amount
                    then Some <$> create this with amount = amount - transferAmount
                    else pure None
        pure (paid, change)
```

> **Earmarking / explicit disclosure.** Authority and *visibility* are separate in Daml: the agent gets the treasurer's authority to `Transfer` (delegated via the mandate's signatory), but it must still be able to *see* the cash contract to use it as input. So the treasury **earmarks** a holding for the mandate by disclosing it to the agent (`observers = [agent]`) — the agent can settle it inside `Commit` without ever owning or controlling it, and the payee's received cash carries no earmark (`observers = []`).

### The anti-race cumulative cap (a question judges will ask)

> *"Can two concurrent agent actions both slip past the cumulative budget?"* **No.**

Because `Commit` **consumes (archives)** the current `SpendMandate` and **creates** a new one with reduced `remainingBudget`, two concurrent `Commit`s contend on the same input contract. Canton serializes them: one commits, the other fails because its input contract is already archived (a contention abort). The cumulative cap can never be raced past.

> **Trade-off (disclosed):** this serializes all commits on a single mandate — every purchase contends on one mutable contract, so under high concurrency the loser must retry. For procurement (low TPS) this is fine. The standard scale-out — sharding a budget across N sub-mandate contracts — is on the [roadmap](#roadmap), not the MVP.

```mermaid
stateDiagram-v2
    [*] --> Active: Treasurer issues, remaining = 50k
    Active --> Active: Commit 9k, archive + recreate, remaining = 41k
    Active --> Rejected: Commit 12k over-cap, precondition fails
    Rejected --> Active: no state change
    Active --> Archived: Revoke
    Archived --> [*]: agent next Commit fails, no input contract
```

---

## Core Flows (Sequence Diagrams)

### Happy path — issue → sealed RFQ → atomic commit

```mermaid
sequenceDiagram
    actor T as Treasurer
    participant L as Canton Ledger
    participant Ag as Buyer Agent
    actor SA as Supplier A
    actor SB as Supplier B

    T->>L: create SpendMandate (cap 50k, 10k/tx, A/B/C)
    Note over L: visible to Treasurer + Agent only
    Ag->>L: open RFQ (cloud-compute)
    SA->>L: create RfqQuote (price 9k)
    SB->>L: create RfqQuote (price 9.5k)
    Note over SA,SB: A cannot see B's quote, and vice-versa
    Ag->>L: exercise Commit (quote=A, amount 9k)
    activate L
    L->>L: assert caps / allow-list / expiry OK
    L->>L: Accept quote then create PurchaseOrder
    L->>L: Transfer Iou 9k to Supplier A
    L->>L: archive + recreate SpendMandate (remaining 41k)
    deactivate L
    L-->>SA: PurchaseOrder = Authorized + Funded (no cap shown)
    L-->>T: live gauge shows 9k / 50k
```

### Money-shot #1 — the ledger says no

```mermaid
sequenceDiagram
    participant Ag as Buyer Agent
    participant L as Canton Ledger
    Ag->>L: exercise Commit (amount 12k) -- over per-tx cap
    activate L
    L->>L: assertMsg "amount exceeds per-tx cap" FAILS
    L-->>Ag: TRANSACTION REJECTED at ledger
    deactivate L
    Note over L: nothing debited / no PO / no payment
    Ag->>L: exercise Commit (supplier = D) -- off allow-list
    activate L
    L->>L: assertMsg "supplier not on allow-list" FAILS
    L-->>Ag: TRANSACTION REJECTED at ledger
    deactivate L
```

### Money-shot #2 — instant revoke

```mermaid
sequenceDiagram
    actor T as Treasurer
    participant L as Canton Ledger
    participant Ag as Buyer Agent
    T->>L: exercise Revoke
    L->>L: archive SpendMandate
    Ag->>L: exercise Commit (compliant 5k)
    activate L
    L-->>Ag: REJECTED - input contract no longer exists
    deactivate L
    Note over Ag: the agent is powerless the instant authority is withdrawn
```

---

## Atomic Settlement & Data Flow

Authority flows **down**, money flows **on outcome**, and visibility is sliced by **need-to-know**.

```mermaid
flowchart TB
    T[Treasurer] -->|1 create SpendMandate| M[(SpendMandate: cap + remaining)]
    M -.observer.-> Ag[Buyer Agent]
    Ag -->|2 open RFQ| RFQ{Sealed-bid auction}
    SA[Supplier A] -->|quote| RFQ
    SB[Supplier B] -->|quote| RFQ
    SC[Supplier C] -->|quote| RFQ
    Ag -->|3 exercise Commit| TX

    subgraph TX["ONE ATOMIC TRANSACTION - all-or-nothing"]
        direction TB
        C1[assert caps then allow-list then expiry]
        C2[Accept winning quote then create PurchaseOrder]
        C3[Transfer Iou cash to supplier - DvP]
        C4[archive + recreate SpendMandate, remaining reduced]
        C1 --> C2 --> C3 --> C4
    end

    TX -->|PurchaseOrder: Authorized+Funded| SA
    TX -->|new remaining budget| T
    TX -. cap never leaves need-to-know .-> SA
```

**The atomic guarantee:** preconditions pass → mandate debit + funded `PurchaseOrder` + escrow lock + `AuditRecord` commit together. Any precondition fails (or the cash leg is underfunded) → the **entire** transaction aborts and nothing changes. And because the payment is **locked in escrow** at `Commit` and released to the supplier only on `ConfirmReceipt`, the agent can never reach a half-spent **or paid-but-undelivered** state — that "no paid-but-undelivered" claim is now tested (`testDeliveryReleasesPayment`), not aspirational.

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **Smart contracts** | **Daml** (Canton's contract language) | Models rights/obligations with native signatory/observer privacy + atomic multi-party transactions |
| **Ledger / runtime** | **Canton** (local sandbox / devnet for the hackathon) | Sub-transaction privacy + atomic settlement; production uses the Global Synchronizer |
| **Holdings / settlement** | `Iou` stub for MVP → **Daml Finance** library for hardening | Credible tokenized-cash + DvP settlement primitives |
| **Integration** | **Daml Ledger API** — JSON API + gRPC, streaming | Live, party-scoped reads that drive the UI; the agent's action surface |
| **Codegen / types** | `@daml/types`, `@daml/ledger`, `@daml/react`, Daml TS codegen | Type-safe contract bindings in TypeScript |
| **Agent** | **TypeScript** (Node) — thin scripted loop | Security lives in the ledger; agent is intentionally minimal |
| **Agent reasoning (real LLM)** | **Ollama Cloud** (`gpt-oss:120b-cloud`) — *chooses among ledger-compliant quotes, whitelist-validated, zero enforcement authority* | Demonstrates real agentic reasoning without making the LLM a trust anchor |
| **Frontend** | **React + Vite + TypeScript**, Tailwind CSS, `@daml/react` | Three party-scoped panels with live streaming state |
| **Identity** | JWT party tokens (Canton sandbox auth) | Scopes each UI/agent to a single Daml party |
| **Testing** | **Daml Script** — 25 ledger tests incl. an adversarial suite (prompt-injection-inert, forged-amount, self-approval) + DvP-delivery + governance | Proves policy enforcement & atomicity deterministically |
| **Dev tooling** | Daml SDK, Daml Studio (VS Code), pnpm | Standard Canton developer workflow |
| **Hosting (live link)** | Vercel / Netlify (UI) + hosted Canton sandbox/devnet | Satisfies the "link to live product" submission requirement — free tier |

> **Cost to build: ~$0.** Canton sandbox/devnet is free, the Daml SDK is free, all cash is a mock `Iou`, the agent is scripted (no paid LLM required), and UI hosting fits free tiers.

---

## Repository Structure

```
mandaterail/
├── daml.yaml                      # sdk 2.10.4 | source: daml | init-script: MandateRail.Bootstrap:setup
├── daml/MandateRail/              # Layer 1 - the enforcement core
│   ├── Cash.daml                  # Iou tokenized-cash stub (DvP leg)
│   ├── Purchase.daml              # PurchaseOrder (Authorized + Funded slice)
│   ├── Rfq.daml                   # RfqQuote (sealed bid) + Accept
│   ├── Mandate.daml               # SpendMandate + Commit/CommitApproved + Revoke (enforcement core)
│   ├── Charter.daml               # TreasuryCharter (CEO+CFO multi-sig) + MintMandate (tighten-only)
│   ├── Approval.daml              # ApprovalRequest (human-in-the-loop over-cap escalation)
│   ├── Audit.daml                 # AuditRecord + RevocationRecord (immutable, regulator-observable)
│   ├── Bootstrap.daml             # Daml Script: parties + balances (init-script)
│   └── Tests.daml                 # Daml Script: 25 tests (caps, allow-list, race, revoke, charter, escalation, adversarial, DvP-delivery, governance)
├── daml.js/                       # generated TS bindings (daml codegen js) - pnpm workspace pkg
├── agent/                         # Layer 3 - buyer agent (zero enforcement authority)
│   ├── src/
│   │   ├── agent.ts               # read quotes -> reason -> exercise Commit
│   │   ├── reasoner.ts            # optional REAL model call via Ollama Cloud (validated, ledger still decides)
│   │   ├── sanitize.ts            # strip prompt-injection from counterparty ledger text
│   │   ├── intent.ts              # presentation-only intent line (no authority)
│   │   └── config.ts             # dev token mint + Ollama Cloud settings
│   └── package.json
├── frontend/                      # Layer 4 - Next.js UI (standalone npm app, own lockfile)
│   ├── app/
│   │   ├── api/                   # backend-for-frontend route handlers -> JSON API
│   │   │   ├── state/route.ts     # role-scoped snapshot (proves privacy)
│   │   │   ├── commit/route.ts    # agent: cheapest | overcap | offlist
│   │   │   ├── revoke/route.ts    # treasurer kill switch
│   │   │   └── issue/route.ts     # reset: archive all + re-seed
│   │   ├── lib/                   # server JSON-API client + HS256 token mint
│   │   ├── components/ui.tsx
│   │   ├── page.tsx               # premium landing page
│   │   └── demo/page.tsx          # 4-panel cockpit (Treasurer/Agent/Supplier/Regulator) + autopilot
│   └── .env.local                # JSON_API_URL + DAML_PACKAGE_ID (gitignored)
├── docs/
│   ├── diagrams/                  # architecture, sequence, privacy, screenshots
│   └── deck.pdf                   # presentation deck (submission)
├── pnpm-workspace.yaml            # links daml.js + agent (frontend is standalone npm)
├── .gitignore
├── LICENSE
└── README.md
```

---

## Getting Started

### Prerequisites
- [Daml SDK **2.10.4**](https://docs.daml.com/getting-started/installation.html)
- Node.js >= 18 and `pnpm`
- (Optional) `OLLAMA_KEY` (+ `OLLAMA_HOST`/`OLLAMA_MODEL`) for the live model-reasoning demo via Ollama Cloud

### 1. Build & start the ledger

```bash
# from repo root
daml build
daml start          # compiles Daml, starts sandbox + JSON API, runs Bootstrap script
```

`daml start` boots a local Canton sandbox, deploys the DAR, exposes the JSON Ledger API (default `http://localhost:7575`), and runs `Bootstrap.daml` to create the demo parties (Treasurer, BuyerAgent, Bank, Regulator, CEO, CFO, Supplier A/B/C/D) and opening cash balances.

### 2. Generate TypeScript bindings

```bash
daml codegen js .daml/dist/*.dar -o daml.js
```

This emits a `daml.js/` package consumed by `agent/` via the pnpm workspace (`pnpm-workspace.yaml`). Re-run after any change to the Daml model. (The `frontend/` UI does not use these bindings — it talks to the JSON API via `fetch`.)

### 3. Run the UI (cockpit — four party panels)

The UI is a standalone Next.js app in `frontend/` (a **backend-for-frontend**: its route handlers proxy the Daml JSON API and mint per-party tokens server-side). It needs the DAR's package id:

```bash
cd frontend
cp .env.example .env.local
# set DAML_PACKAGE_ID — from the repo root:
#   daml damlc inspect-dar --json .daml/dist/mandaterail-1.0.0.dar   (copy main_package_id)
npm install
npm run dev          # http://localhost:3000
```

The dashboard shows the Treasurer console (budget gauge, issue/revoke), the Buyer Agent (sealed quotes + commit/over-cap/off-list + live ledger log), and Supplier A (its `Authorized + Funded` slice with the cap proven **NOT VISIBLE**). Re-run the `inspect-dar` step whenever the Daml model changes.

### 4. Run the scripted agent

With `daml start` running (step 1) and bindings generated (step 2), install once and run the agent from the repo root:

```bash
pnpm install
pnpm --filter @mandaterail/agent start
```

The agent connects via the JSON Ledger API, discovers the `BuyerAgent` party, reads the mandate + sealed quotes, and runs three beats:

```text
[1] Awarding the cheapest compliant quote ...
    ✓ COMMIT OK — mandate debited + PO issued + cash settled, atomically.
    remaining budget now: 41000.0
[2] Money-shot #1a — trying an OVER-CAP purchase ...
    ✓ REJECTED BY THE LEDGER (not app code): ... "amount exceeds per-tx cap"
[3] Money-shot #1b — trying an OFF-ALLOW-LIST supplier ...
    ✓ REJECTED BY THE LEDGER (not app code): ... "supplier not on allow-list"
```

The rejections are raw Daml `AssertionFailed` errors from the `SpendMandate.Commit` choice — proof the guardrail is the ledger, not the agent.

> **Note:** the agent reads `LEDGER_ID=sandbox` (the `daml start` default) and a dev `LEDGER_SECRET`. See `agent/.env.example`. **Re-run `pnpm codegen` after any change to the Daml model** — the bindings embed the package id, which changes when the Daml source changes.

---

## Configuration

Copy `.env.example` to `.env` in `agent/` (the `frontend/` UI uses its own `.env.local`, see step 3). Defaults match `daml start`.

| Variable | Default | Used by | Purpose |
|---|---|---|---|
| `LEDGER_HOST` | `localhost` | agent, ui | Daml JSON API host |
| `LEDGER_PORT` | `7575` | agent, ui | Daml HTTP JSON API port (gRPC Ledger API is `6865`) |
| `TREASURER_TOKEN` | _(JWT)_ | ui (treasurer) | Party JWT scoping the console to the `treasurer` party |
| `AGENT_TOKEN` | _(JWT)_ | agent, ui (agent) | Party JWT for the `agent` party |
| `SUPPLIER_A_TOKEN` … `D` | _(JWT)_ | ui (supplier) | Per-supplier party JWTs |
| `OLLAMA_KEY` | _(unset)_ | agent (optional) | Enables the real model-reasoning step via Ollama Cloud (`OLLAMA_HOST`/`OLLAMA_MODEL` default to `https://ollama.com` / `gpt-oss:120b-cloud`); **omit to run fully deterministic** |

> Party JWTs for the local sandbox are minted by `daml start` / the JSON API dev auth; a helper script (`scripts/tokens.sh`) prints ready-to-paste tokens for each demo party.

---

## The 3-Minute Demo Script

**[0:00–0:30] Hook.** Three panels side by side: Treasurer, BuyerAgent, Supplier A.
> *"Enterprises want AI agents to buy things autonomously. Treasury says no — because today an agent's spending limit is a spreadsheet and an API key, and to buy anything it would leak your budget and prices to every supplier. We fixed that by moving the guardrail off the AI and onto Canton."*

**[0:30–1:00] Issue the mandate.** Treasurer issues a `SpendMandate` to BuyerAgent: cloud-compute, $50,000 total, $10,000/tx, suppliers A/B/C, 30-day expiry. The agent's gauge reads **$0 / $50,000**.
> *"These limits are not app settings — they're enforced inside the Daml contract."*

**[1:00–1:45] Sealed sourcing + atomic commit.** Agent opens an RFQ; A, B, C submit quotes. Flip to A's and B's panes: *"A cannot see B's price; neither can see the budget."* Agent awards A @ $9,000 and clicks Commit. In **one transaction**: gauge → **$9k / $50k**, a PurchaseOrder appears, cash settles to A. A's pane flips to a green **AUTHORIZED + FUNDED** badge.
> *"Supplier A sees it's authorized and paid. It does NOT see the remaining $41,000. That privacy is why suppliers can't price you up to your cap."*

**[1:45–2:30] Money-shot #1 — the ledger says no.** Prompt the agent to buy **$12,000** (over the per-tx cap). A red rejection appears; highlight that the error originates from **Canton, not app code**: *"precondition failed at the ledger — nothing debited, no PO, no payment."* Repeat with non-approved Supplier **D** → same hard rejection.
> *"The agent is structurally incapable of exceeding its mandate. This is not a prompt guardrail. It's settlement-level authority."*

**[2:30–3:00] Money-shot #2 — instant revoke + audit.** Treasurer clicks **Revoke**; the mandate is archived. BuyerAgent immediately attempts another compliant purchase → it fails instantly. Close on the append-only audit log.
> *"Bounded. Private. Atomic. Trust the ledger, not the model — that's MandateRail on Canton."*

---

## MVP Scope (In / Out)

Ruthlessly minimal, to guarantee a **working live demo**.

### In scope (hackathon)
- One `SpendMandate` template with all four constraints (per-tx cap, cumulative cap, expiry, allow-list) enforced as preconditions.
- Contention-safe `Commit` bundling debit + `PurchaseOrder` + tokenized-cash transfer **atomically**.
- Minimal sealed-bid RFQ: exactly **3 suppliers (A/B/C)** + **1 off-allow-list supplier (D)** for the negative path.
- One polished **Treasurer Console** (issue, live consumption gauge, Revoke, audit log), one minimal **Supplier** proof view (`Authorized + Funded` only), one compact **Agent** pane.
- A **thin scripted** agent loop (no real autonomous negotiation).
- A tokenized-cash **stub** (single currency, no real payment rail).
- Deployed live with reachable URLs.

### Out of scope (future work)
- Real LLM-driven negotiation; multi-round or scored auctions (MVP = single-round lowest-compliant).
- Multi-currency; real oracle / delivery confirmation.
- Full procurement-suite features (catalogs, approval chains).
- Any payment-rail integration (replaced by the `Iou` stub).

### Day-one make-or-break items
1. The `Commit` precondition failure must surface as a **genuine ledger error**, not an app-layer check (it *is* the whole pitch).
2. The **archive-and-recreate** cumulative-cap pattern, so concurrent commits cannot race past the budget.

**Target:** 36–72h build · demoable in 3 minutes with two dramatic beats.

---

## Testing

Daml Script tests prove the guarantees deterministically — these double as judge-facing evidence that *it actually works*:

| Test | Asserts |
|---|---|
| `testHappyPath` | A compliant `Commit` debits the mandate, creates the PO, and transfers cash atomically |
| `testOverPerTxCap` | `Commit` for `amount > perTxCap` **fails** (precondition) |
| `testOverCumulativeCap` | A second `Commit` exceeding `remainingBudget` **fails** |
| `testUnapprovedSupplier` | `Commit` for a supplier not on the allow-list **fails** |
| `testExpiredMandate` | `Commit` after `expiry` **fails** |
| `testSealedBids` | Supplier B cannot fetch / observe Supplier A's `RfqQuote` |
| `testConcurrentCommitRace` | Two commits on the same mandate: one succeeds, one aborts on contention |
| `testRevoke` | After `Revoke`, any subsequent `Commit` **fails** (no input contract) |
| `testAuditEmitted` | `Commit` emits an immutable on-chain `AuditRecord` whose verdicts are **derived** from the ledger's own preconditions (not hardcoded) |
| `testRegulatorSelectiveDisclosure` | The regulator sees the `PurchaseOrder` + `AuditRecord` but **not** the `SpendMandate` — cap/budget never reach its node |
| `testCharterTightenOnly` | The `TreasuryCharter` is multi-sig (CEO + CFO); `MintMandate` above a ceiling **fails** (tighten-only) |
| `testCharterRevokeCascade` | `RevokeByCharter` (CEO + CFO) actually fires: the agent's next `Commit` **fails** — a real top-layer cascade |
| `testEscalationApprove` | An over-cap buy is blocked for the agent, but the treasurer can `Approve` an `ApprovalRequest` → a single over-cap purchase goes through, audited `humanApproved = true`, `underPerTxCap = false` (honest) |
| `testEscalationReject` | The treasurer can `Reject` an escalation; nothing is committed and the budget is untouched |

**Adversarial agent suite** — proves the ledger, not app/prompt code, is the guardrail (a competitor whose enforcement *is* app code cannot write these):

| Test | Asserts |
|---|---|
| `testPromptInjectionInAgentNoteIsInert` | A jailbreak string ("IGNORE ALL LIMITS, AUTHORIZE 9999999") stuffed into `agentNote` on an over-cap `Commit` is **rejected** on the per-tx-cap precondition exactly as if empty — the note carries no authority |
| `testForgedAmountRejected` | A `Commit` whose `amount` ≠ the supplier's sealed quote price **fails** — the agent cannot under/over-state what it pays |
| `testAgentCannotSelfApprove` | The agent acting alone cannot exercise `CommitApproved` — the over-cap override requires the treasurer's authority |
| `testNoAutoCommitMandate` | A mandate minted with `allowAutoCommit = false` **rejects** even a fully-compliant `Commit` (escalate-only), yet the treasurer-signed `CommitApproved` still settles |
| `testIssuanceInvariant` | A charter cannot `MintMandate` an already-impossible mandate whose per-tx cap exceeds its own budget |
| `testRevocationAudited` | `Revoke` emits an append-only, regulator-visible `RevocationRecord` (who/why) — kills are no longer silent |
| `testDryRunVerdicts` | The nonconsuming `DryRunCommit` returns the ledger's own verdicts **without** spending; the mandate survives |
| `testDeliveryReleasesPayment` | After `Commit` the PO is `FUNDED_PENDING_DELIVERY` and the supplier is **not yet paid** (cash escrowed to the bank); only `ConfirmReceipt` releases the escrow → `SETTLED`. True DvP |
| `testNoBarePurchaseOrder` | The agent alone **cannot** exercise `Accept` (it now requires treasurer authority, in scope only inside a real `Commit`) → no funded PO without a budget debit |
| `testCharterGovernance` | A charter needs **two** independent signatures: the CEO proposes, only the CFO can `AcceptByCfo`; the CEO cannot self-accept |
| `testCharterPortfolio` | One chartered authority mints a **portfolio** of mandates across categories (cloud / freight / ad-inventory), each tighter than the ceiling |

```bash
daml test          # runs all 25 Daml Script tests
```

> ✅ **All 25 tests pass on Daml SDK 2.10.4** (`daml build` + `daml test` green).

---

## Mapping to the Judging Criteria

| Criterion (from the brief) | How MandateRail scores |
|---|---|
| **Technical execution** | Ledger-level authority via choice preconditions + a single atomic DvP `Commit`; clean Daml model with a full Daml Script test suite; the over-cap rejection and instant revoke demonstrably originate from Canton |
| **Originality & creativity** | "Guardrails enforced by the blockchain, not the model" — fused with remaining-budget privacy (anti price-to-cap) and sealed bids (anti agent-collusion). The deliberate inversion of the AI-wrapper trope the track warns against |
| **User experience & design** | A treasurer issuing a mandate, watching a live consumption gauge, and revoking with one click — an interface a real controller could use; the supplier's `Authorized + Funded`-only view makes privacy visceral |
| **Real-world applicability** | Agentic procurement is imminent and treasury's #1 blocker is exactly safe, bounded, private delegation — a credible commercial pain, not a retail crypto toy |

---

## Roadmap

- **Phase 0 — Hackathon MVP:** the demo above (single mandate, atomic commit, 3-supplier sealed RFQ, three panels, scripted agent, cash stub, live deploy).
- **Phase 1 — Hardening:** multi-currency caps & DvP; scored / multi-round reverse auctions; SOX-style audit/compliance export; role hierarchy (CFO → controllers → agents) via **nested mandates**.
- **Phase 2 — Agent integration:** SDK + Ledger-API adapters so existing procurement/FinOps agents can hold and exercise mandates; delivery/outcome oracles so POs settle against attested receipt, not just funding.
- **Phase 3 — Network:** a shared procurement venue where many buyers and suppliers transact under mutual privacy, the operator unable to see caps or competing quotes; **Daml Finance** + a regulated tokenized-deposit issuer to replace the stub.
- **Phase 4 — Standardization:** publish `SpendMandate` as an open Daml standard for agentic spend authority — the default safety substrate for enterprise autonomous commerce on Canton.

---

## Risks & Mitigations

| # | Risk | Mitigation |
|---|---|---|
| 1 | Judges pattern-match it to an "AI wrapper" | Keep the agent visibly thin & rules-driven; the centerpiece beats are the agent **failing** to break the rules |
| 2 | Judges miss that enforcement is at the ledger, not app code | Surface the actual Canton precondition-failure error on screen and call it out — this single distinction is the whole pitch |
| 3 | Concurrent-commit race past the cumulative cap | Archive-and-recreate the `SpendMandate`, so a second concurrent `Commit` fails on a consumed contract; covered by a test |
| 4 | Sealed-bid privacy modeled sloppily so quotes leak | Rival suppliers are never observers of `RfqQuote`; verified by a per-node visibility test |
| 5 | Overscope (3 UIs + auction + agent + cash stub is a lot) | One polished treasurer console, one minimal supplier view, single-round lowest-compliant auction, scripted agent, single-currency stub |
| 6 | "A SaaS DB could enforce an invisible cap for one party" | Keep multi-party non-repudiation + atomic cross-party DvP front and center — a single-operator DB cannot give a buyer and an independent supplier shared, trustless, atomic settlement |
| 7 | Tokenized cash is a stub | State it plainly as the settlement medium; the **DvP atomicity** is the point, not the asset; Daml Finance integration is on the roadmap |

---

## FAQ

**Isn't this just an AI wrapper?**
The opposite. The agent is a thin, replaceable, scripted loop with **zero enforcement authority**. All control lives in the Daml contract. Swap the agent for any model — the ledger guarantees are identical. The demo's centerpiece is the agent *failing* to break the rules.

**Why not just enforce caps in a normal SaaS database?**
A single-operator DB can hide a cap from one party, but it cannot give a buyer and an independent supplier — who do **not** share a trusted operator — cryptographic, non-repudiable, **atomic cross-party settlement** plus an audit trail each side independently trusts. Remove that and you are back to "trust our backend."

**What happens if the agent's API key is stolen?**
The attacker can only spend **in-policy** — within the per-tx cap, cumulative budget, allow-list, and expiry — and the treasurer can `Revoke` instantly. The mandate bounds the blast radius; it does not claim to stop in-policy abuse of a stolen key (key custody is orthogonal). This is still strictly stronger than today's "API key + spreadsheet."

**Can the agent collude with a supplier or pay a friend above market?**
It can choose any *compliant* supplier at any *in-cap* price — that in-policy discretion is intentional. Sealed bids remove the ledger-level channel for in-auction collusion/price-to-cap; scored multi-round auctions and supplier-performance scoring are on the roadmap.

**Does the supplier really learn nothing about the budget?**
The supplier is never a stakeholder of `SpendMandate`, so the cap/remaining never reach its node. It can only infer the trivial lower bound `cap ≥ its own accepted amount`. No competing quotes ever reach a rival.

**Is the privacy real on a single sandbox?**
On the sandbox, privacy is enforced by signatory/observer scoping (each party's view is JWT-scoped). Full cross-node byte-level privacy is the multi-participant production deployment — same model, different topology. We disclose this in [Honest Scope](#honest-scope--disclaimers).

---

## Honest Scope & Disclaimers

We are explicit about what is real vs. mocked — this credibility is itself a judging asset:

- **Tokenized cash is a simplified `Iou` stub**, not a regulated payment rail. The atomic DvP *mechanism* is real; the *asset* is mocked. The hardened version uses **Daml Finance** holdings.
- **The agent is a thin scripted loop.** Any LLM ("intent") has **zero enforcement authority** — by design. The ledger is the only trust anchor.
- **Single currency, single-round auction, lowest-compliant selection** in the MVP.
- **Deployment topology:** the MVP runs on a single local Canton sandbox participant; privacy is enforced by signatory/observer scoping. Cross-*node* sub-transaction privacy is the production deployment on multi-participant Canton + the Global Synchronizer — same privacy *model*, different topology.
- **What the mandate does NOT prevent:** if the agent's *key* is stolen, the attacker can still spend **in-policy** up to the cap. The mandate **bounds the blast radius** to exactly what the treasurer authorized and gives instant `Revoke`; it does not eliminate in-policy abuse of a compromised key.
- **Privacy floor:** a supplier can trivially infer `cap ≥ its own accepted amount` — an unavoidable information-theoretic lower bound, **not** a Daml leak. The actual cap and remaining budget never reach its node.
- **Expiry semantics:** `expiry` is enforced **at exercise time** (`Commit` rejects after expiry). An expired-but-unrevoked mandate lingers as an inert active contract until archived — it is not auto-archived. `getTime` returns deterministic ledger time within Canton's record-time tolerance.
- Daml snippets in this README are **illustrative**; the compiling, tested source is in [`/daml`](#repository-structure).

---

## Submission Artifacts

- ✅ **Public repository:** https://github.com/EzraNahumury/MandateRail
- ⏳ **3-minute video pitch + demo:** _add link before submission_
- ⏳ **Live product:** runs locally (Canton sandbox) — _public deploy + URL before submission_
- ⏳ **Presentation deck:** _add `docs/deck.pdf` before submission_

> ⚠️ **Pre-submission checklist:**
> - [x] Apache 2.0 `LICENSE`
> - [x] Screenshots into `docs/diagrams/` (landing, cockpit, sign-in)
> - [x] `daml test` passes (21/21) and the app runs on a fresh `daml start` + `npm run dev`
> - [ ] Record + link the 3-minute video (lead with the two money-shots)
> - [ ] Deploy the UI + a hosted sandbox and paste the live URL
> - [ ] Add the presentation deck
> - [ ] Fill in the team names + contact below

---

## Team & Acknowledgements

**Team:** Ezra Nahumury — solo build · GitHub [@EzraNahumury](https://github.com/EzraNahumury) · ezranhmry@gmail.com

**Acknowledgements:**
- [Canton Foundation](https://canton.foundation/) — for the hackathon and the privacy-enabled L1.
- [Digital Asset](https://www.digitalasset.com/) — Daml & the Canton Network.
- The Daml Finance library — production holdings/settlement primitives (roadmap).

---

## License

Apache License 2.0 — see [`LICENSE`](LICENSE).

---

<p align="center"><strong>Bounded. Private. Atomic.</strong><br/>Trust the ledger, not the model.</p>

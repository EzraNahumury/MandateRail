# MandateRail — 3-Minute Demo Video Script

**Thesis on screen:** *"Trust the ledger, not the model."*
Enforcement lives in Daml choice preconditions — not in app code, not in a prompt.

**Repo:** https://github.com/EzraNahumury/MandateRail · **Track:** Payments, Neobanking & Agentic Commerce · Build-on-Canton, June 2026.

This is a self-record script. Read it once end-to-end, run the setup checklist, then record in a single take following the timestamped blocks. Narration is written to be read aloud at ~150 words/minute; each block lists a target word count so you stay on pace.

---

## Pre-flight setup checklist (do BEFORE you hit record)

- [ ] **Ledger up.** In PowerShell: `.\run-ledger.ps1 up` — confirms `JAVA_HOME` is set, `daml.cmd` on PATH, sandbox + JSON Ledger API live on **:7575**. Wait for the bootstrap to finish (parties Treasurer, BuyerAgent, Bank, Regulator, CEO, CFO, Supplier A/B/C/D + opening cash).
- [ ] **Frontend up.** In the frontend dir: `npm run dev` — Next.js on **:3000**. Wait for "ready".
- [ ] **(Optional sanity)** `daml test` passes all 21 Daml Script tests — keep the terminal visible if you want a credibility cutaway.
- [ ] **Open the cockpit** at `http://localhost:3000/demo`. Sign in each pane to its party so **four panels** are live: **Treasurer console**, **Buyer Agent**, **Supplier A**, **Regulator/Auditor**.
- [ ] **Browser zoom ~90%** so all four panels + the spend-analytics strip fit without scrolling.
- [ ] **Reset state** so the gauge reads **$0 / $50,000** and no mandate is active (re-run `run-ledger.ps1 up` if a previous take left contracts behind).
- [ ] Close notifications/Slack; full-screen the browser; mic check; cursor speed slowed down so clicks are legible.
- [ ] Have the over-cap value **$12,000** and off-list **Supplier D** ready to click — don't fumble for them on camera.

**Panel layout cheat-sheet (left→right, top→bottom):**
`Treasurer` (issue / revoke + live gauge) · `Buyer Agent` (RFQ, award, Commit, Try over-cap / Try off-list) · `Supplier A` (Authorized + Funded badge; budget NOT VISIBLE) · `Regulator` (append-only audit trail).

---

## [0:00–0:30] Hook + the four panels — *76 words*

**On-screen action:** Open on the full cockpit, all four panels visible. Slowly sweep the cursor across each panel header as you name it. End the sweep resting on the Treasurer panel.

**Narration:**
> "Enterprises want AI agents to buy things autonomously — but treasury says no. Today an agent's spending limit is a spreadsheet and an API key, and to buy anything it leaks your budget and prices to every supplier. MandateRail fixes that. Four parties, one ledger: Treasurer, Buyer Agent, Supplier A, and a Regulator — and the guardrail lives on Canton, not on the model. Trust the ledger, not the model."

---

## [0:30–1:00] Treasurer issues the SpendMandate — *71 words*

**On-screen action:** In the Treasurer console, fill the issue form: category cloud-compute, **$50,000** budget, **$10,000** per-tx cap, suppliers **A, B, C**, **30-day** expiry. Click **Issue Mandate**. Cut to the Buyer Agent gauge snapping to **$0 of $50,000**.

**Narration:**
> "The Treasurer issues one SpendMandate to the agent: fifty thousand dollar budget, ten thousand per transaction, suppliers A, B and C only, expires in thirty days. Watch the agent's gauge — zero of fifty thousand committed. These four limits are not app settings. They're encoded as preconditions inside the Daml contract, so the agent is structurally incapable of breaching any of them."

---

## [1:00–1:45] Sealed RFQ + atomic Commit — *96 words*

**On-screen action:** In Buyer Agent, open an **RFQ**; A, B, C submit quotes. **Flip between Supplier A's pane and Supplier B's pane** — point the cursor at each: A shows its own quote, B shows its own, neither shows the other's price or the budget ("Mandate & budget: NOT VISIBLE"). Back in Buyer Agent, **award Supplier A @ $9,000** and click **Commit**. In one transaction: gauge → **$9k committed of $50k**, a **PurchaseOrder** appears, cash settles. Supplier A's pane flips to the green **AUTHORIZED + FUNDED** badge.

**Narration:**
> "The agent opens a sealed RFQ. Watch closely — I flip to Supplier A, then Supplier B. A cannot see B's price; B cannot see A's; and neither can see the budget. That price-blindness is why suppliers can't quietly price you up to your cap. The agent awards A at nine thousand and commits. In a single atomic transaction the gauge moves to nine of fifty, a Purchase Order is created, and cash settles. Supplier A now sees Authorized and Funded — and nothing about the remaining forty-one thousand."

---

## [1:45–2:30] Money-shot #1 — the ledger says NO — *92 words*

**On-screen action:** In Buyer Agent, **Try over-cap: $12,000** → a **red banner**: *"REJECTED BY LEDGER — amount exceeds per-tx cap."* Hold on it 2 sec; point out gauge is unchanged (still $9k), no new PO, no payment. Then **Try off-list: Supplier D** → same hard red rejection. *(Optional, if time:* **Escalate** the $12k → Treasurer console shows an **ApprovalRequest** → Treasurer clicks **Approve** → it settles once with a **human-approved** audit badge.*)*

**Narration:**
> "Now I tell the agent to spend twelve thousand — over the per-transaction cap. Red. Rejected by the ledger: amount exceeds per-tx cap. Nothing debited, no PO, no payment — and that error is a real Daml precondition failure on Canton, not app code, not a prompt. Same story off the allow-list: try Supplier D, hard rejection. And if a human genuinely wants the override, the agent can only escalate — the Treasurer approves a single transaction, and it's stamped human-approved in the audit trail."

---

## [2:30–3:00] Money-shot #2 — Revoke + close on the audit trail — *84 words*

**On-screen action:** In the Treasurer console, click **Revoke**, type a reason ("budget reallocated"), confirm — the mandate is archived. Cut to Buyer Agent attempting another fully compliant purchase → it **fails instantly**. End on the **Regulator panel**: scroll the append-only audit trail showing the PurchaseOrder, the AuditRecords, and the new **RevocationRecord** (who revoked, why) — while the cap, budget, and sealed quotes stay invisible to the regulator. Hold the final frame.

**Narration:**
> "Finally, the Treasurer revokes — with a reason — and the mandate is archived instantly. The agent's very next compliant purchase fails immediately; authority is gone. And the Regulator sees the whole story: the Purchase Order, every audit record, and a Revocation Record naming who killed it and why — but never the cap, the budget, or the sealed quotes. Bounded. Private. Atomic. Trust the ledger, not the model. That's MandateRail on Canton."

---

## Pacing summary

| Block | Window | Words | Beat |
|---|---|---|---|
| Hook + four panels | 0:00–0:30 | 76 | Why this exists |
| Issue SpendMandate | 0:30–1:00 | 71 | The mandate, gauge $0/$50k |
| Sealed RFQ + atomic Commit | 1:00–1:45 | 96 | Privacy + $9k committed, PO, FUNDED |
| Money-shot #1 — ledger says NO | 1:45–2:30 | 92 | Over-cap + off-list rejected |
| Money-shot #2 — Revoke + audit | 2:30–3:00 | 84 | Instant kill, RevocationRecord |
| **Total** | **3:00** | **~419** | ~140 wpm — comfortable |

---

## Judging-criteria coverage

| Criterion | Where the video proves it | Timestamp |
|---|---|---|
| **Technical execution** | Authority enforced as Daml choice preconditions; one atomic DvP Commit (debit + PO + cash + AuditRecord); over-cap and revoke rejections demonstrably originate from Canton, not app/prompt code; 21 passing Daml Script tests behind it. | 0:30, 1:00–1:45, 1:45–2:30, 2:30 |
| **Originality & creativity** | "Guardrails enforced by the blockchain, not the model" — fused with remaining-budget privacy (anti price-to-cap) and sealed bids (anti collusion); the deliberate inversion of the AI-wrapper trope. | 0:00, 1:00–1:45, 1:45–2:30 |
| **User experience & design** | A treasurer issues a mandate, watches a live consumption gauge, and revokes in one click; Supplier A's *Authorized + Funded*-only view makes privacy visceral across four live panels. | 0:00, 0:30, 1:00–1:45, 2:30 |
| **Real-world applicability** | Agentic procurement is imminent and treasury's #1 blocker is safe, bounded, private delegation — a credible commercial pain, with a regulator-grade audit trail, not a retail crypto toy. | 0:00, 1:45–2:30, 2:30 |

---

*Recorded against a local Canton sandbox (JSON Ledger API :7575) with the Next.js cockpit (:3000). No mock data — every panel value is derived live from the on-chain audit trail.*

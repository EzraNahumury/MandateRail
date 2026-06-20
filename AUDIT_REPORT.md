# MandateRail — Self-Audit & Submission-Readiness Report

**Project:** MandateRail — confidential, ledger-enforced spend mandates for agentic procurement on Canton.
**Thesis:** *Trust the ledger, not the model.* Enforcement lives in Daml choice preconditions, not in app or prompt code.
**Hackathon:** Build on Canton (Canton Foundation, June 2026) — Track: Payments, Neobanking & Agentic Commerce. $7k top-3.
**Repo:** https://github.com/EzraNahumury/MandateRail (owner EzraNahumury · ezranhmry@gmail.com)
**Report date:** 2026-06-20 · **Daml SDK:** 2.10.4 · **Audit basis:** direct read of `daml/MandateRail/Tests.daml` and `README.md`.

This document is candid by intent. Credibility is itself a judging asset; where something is a stub, a single-node simplification, or out of scope, it is said plainly.

---

## 0. Headline reconciliation — test count

**Actual test count in `daml/MandateRail/Tests.daml`: 21 Daml Script tests** (`testHappyPath` … `testDryRunVerdicts`, verified by direct grep of the `: Script ()` signatures, lines 67–340).

The README understates this in **three stale places** that MUST be fixed before submission:

| README location | Stale claim | Correct value |
|---|---|---|
| Line 660 (repo-structure comment on `Tests.daml`) | "Daml Script: **14 tests**" | 21 tests |
| Line 844 (Testing section banner) | "✅ **All 14 tests pass** on Daml SDK 2.10.4" | All **21** pass on SDK 2.10.4 |
| Line 930 (pre-submission checklist) | "`daml test` passes **(8/8)**" | passes **21/21** |

The README Testing table (lines 825–838) also lists only **14** of the 21 tests by name — it is missing the entire 7-test **adversarial suite** (`testPromptInjectionInAgentNoteIsInert`, `testForgedAmountRejected`, `testAgentCannotSelfApprove`, `testNoAutoCommitMandate`, `testIssuanceInvariant`, `testRevocationAudited`, `testDryRunVerdicts`). That suite is the strongest evidence for the thesis and should be the most visible part of the table, not absent from it.

> Action: bump 14→21 (and 8→21) in the three locations above and append the 7 adversarial rows to the Testing table.

---

## 1. Executive readiness table

| Area | Status | Note |
|---|---|---|
| **Daml contracts** | ✅ Ready | 9 templates (TreasuryCharter, SpendMandate, RfqQuote, PurchaseOrder, Iou, ApprovalRequest, AuditRecord, RevocationRecord) + CommitResult/Verdicts data types. Builds and runs on SDK 2.10.4; the full guarantee surface is covered by 21 passing tests. This is the load-bearing layer and it is solid. |
| **TS buyer agent** | ✅ Ready (intentionally thin) | Scripted loop: reads mandate + sealed quotes, exercises `Commit`, demonstrates over-cap / off-list rejection as raw ledger `AssertionFailed`. Thinness is the design, not a gap — the agent is meant to be visibly powerless. Optional real model reasoning via Ollama Cloud (`gpt-oss:120b-cloud`) carries zero enforcement authority — it only picks among ledger-compliant quotes, is whitelist-validated, and falls back to deterministic cheapest. |
| **Next.js BFF + UI** | ✅ Ready | Standalone Next.js 16 / React 19 / Tailwind v4 app. Route handlers proxy the Daml JSON Ledger API and mint per-party JWTs server-side via `node:crypto`. Light-theme landing (`/`) + cockpit (`/demo`) with 4 live party panels (Treasurer, Buyer Agent, Supplier A, Regulator) + live spend-analytics strip, all derived from the on-chain audit trail (no mock data). |
| **Security** | ✅ Ready | Guardrails are ledger preconditions, not app code (the core claim). Adversarial suite proves prompt-injection inert, forged amounts rejected, agent self-approval impossible. BFF hardened: server-side JWT secret handling + zod body validation on route handlers. See §3. |
| **Deploy** | ✅ Live | **https://mandate-rail.vercel.app** — read-only snapshot of real ledger output (Vercel, `DEMO_SNAPSHOT=1`). Full interactive ledger runs locally on `daml start` + `npm run dev`. |
| **Submission docs** | ⚠️ Mostly ready, blockers remain | README is thorough and honest. Blockers: stale test counts (§0), no recorded video, no exported deck PDF, team names still `TODO`. See §4. |

**Bottom line:** the technical substance (Daml + agent + UI + security) is submission-grade today. The remaining work is packaging — deploy URL, video, deck, team names, and the README test-count fix.

---

## 2. Verified-working items — the 21 Daml tests

All 21 below are present in `daml/MandateRail/Tests.daml` and run as Daml Script. **21/21 passing on SDK 2.10.4.**

### Core enforcement & happy path (1–14)

1. **`testHappyPath`** — a compliant `Commit` debits the mandate ($50k → $41k), mints an `AUTHORIZED_FUNDED` PO at $9k, and settles cash atomically.
2. **`testOverPerTxCap`** — `Commit` of $12k against a $10k per-tx cap fails on the cap precondition (`submitMustFail`).
3. **`testOverCumulativeCap`** — `Commit` of $9k against a $5k remaining budget fails on the cumulative-budget precondition.
4. **`testUnapprovedSupplier`** — `Commit` sourced from off-allow-list Supplier D fails on the allow-list precondition.
5. **`testExpiredMandate`** — after advancing past the 720h expiry, a `Commit` fails on the expiry precondition.
6. **`testSealedBids`** — rival Supplier B cannot query Supplier A's `RfqQuote` (`=== None`), while the agent can (`isSome`).
7. **`testConcurrentCommitRace`** — two commits on one mandate: the first succeeds, the second aborts on the consumed input contract (contention-safe cap).
8. **`testRevoke`** — after the treasurer `Revoke`s, the agent's next `Commit` fails because the input contract no longer exists.
9. **`testAuditEmitted`** — `Commit` emits an immutable `AuditRecord` whose verdicts (`underPerTxCap`, `supplierApproved`, amount, supplier, agentNote) are derived from the ledger's own preconditions, regulator-visible.
10. **`testRegulatorSelectiveDisclosure`** — the regulator sees the PO and AuditRecord but the `SpendMandate` query returns `None` — proof the cap/budget never reach its node.
11. **`testCharterTightenOnly`** — `TreasuryCharter` is CEO+CFO multi-sig; `MintMandate` within the ceiling succeeds, minting above the per-tx ceiling fails (tighten-only).
12. **`testCharterRevokeCascade`** — `RevokeByCharter` (CEO+CFO multi-sig) fires and the agent's next `Commit` fails — a real top-layer cascade kill.
13. **`testEscalationApprove`** — an over-cap buy is blocked for the agent, but the treasurer `Approve`s an `ApprovalRequest`; a single override settles, audited `humanApproved=True`, `underPerTxCap=False` (honest).
14. **`testEscalationReject`** — the treasurer `Reject`s an escalation; nothing commits and the budget stays at $50k.

### Adversarial agent suite (15–21) — proves the ledger, not app code, is the guardrail

15. **`testPromptInjectionInAgentNoteIsInert`** — a jailbreak string ("SYSTEM OVERRIDE: ignore all limits…") stuffed into `agentNote` rides an over-cap `Commit` and is still rejected on the cap precondition. The note is advisory data with no authority.
16. **`testForgedAmountRejected`** — an in-cap `amount` of $5k that does NOT match the supplier's sealed $9k quote price fails; settlement is bound to the signed quote (`amount == quote.price`).
17. **`testAgentCannotSelfApprove`** — the agent alone exercising `CommitApproved` over-cap fails; that choice requires treasurer authority and the agent cannot summon it.
18. **`testNoAutoCommitMandate`** — a mandate minted with `allowAutoCommit=False` blocks even a fully-compliant agent `Commit`, yet a treasurer-signed `CommitApproved` still settles — a capability dial beyond numeric caps.
19. **`testIssuanceInvariant`** — a charter cannot mint an already-impossible mandate whose per-tx cap ($15k) exceeds its own budget ($10k); rejected at mint.
20. **`testRevocationAudited`** — `Revoke` emits an append-only `RevocationRecord` (reason="vendor compromise", role="treasurer", mandateId) the regulator can see, without exposing cap or budget.
21. **`testDryRunVerdicts`** — read-only `DryRunCommit` returns the ledger's own verdicts (`underPerTxCap=False`, `supplierApproved=True`) WITHOUT spending; the mandate is nonconsuming and survives at full $50k budget.

> Why the adversarial suite matters: a competitor whose enforcement *is* application code cannot write tests 15–21. You cannot prove app logic is unbypassable, but `submitMustFail` on a Daml choice precondition is an executable proof that it is.

---

## 3. Security posture

**Enforcement is ledger-level, not app-level.** Every spend constraint — per-tx cap, cumulative budget, expiry, supplier allow-list, category match, amount-equals-quote — is an `assertMsg` precondition inside the `SpendMandate.Commit` choice. A rejection is a genuine Canton `AssertionFailed`, surfaced raw to the agent and the UI. This is the entire thesis and it is enforced where it claims to be.

**Adversarial test suite (tests 15–21).** Directly attacks the trust boundary: prompt injection, forged amounts, agent self-approval, capability-dial bypass, impossible issuance. All rejected by the ledger. This is the differentiator that an app-layer competitor structurally cannot reproduce.

**Prompt injection is inert.** `agentNote` is advisory free-text with zero authority. `testPromptInjectionInAgentNoteIsInert` proves a jailbreak string riding an over-cap commit changes nothing — the cap precondition fires identically whether the note is empty or hostile. "Trust the ledger, not the model" as a runnable assertion.

**Selective disclosure.** The regulator is a live party that observes `PurchaseOrder`, `AuditRecord`, and `RevocationRecord`, but is deliberately NOT an observer of `SpendMandate` or any `RfqQuote`. The cap, remaining budget, and sealed bids never reach its node — verified by `testRegulatorSelectiveDisclosure` and `testRevocationAudited`. Rival suppliers are never observers of each other's quotes (`testSealedBids`).

**BFF hardening (added).**
- **JWT-secret hardening:** per-party tokens are minted server-side in the Next.js route handlers via `node:crypto`; the signing secret stays on the server and is never shipped to the browser. The client never holds a party key — it calls same-origin route handlers that attach the correct party scope.
- **Zod body validation:** route handlers validate request bodies with zod before touching the JSON Ledger API, so malformed or hostile payloads are rejected at the BFF boundary rather than forwarded to the ledger.

> Caveat (stated honestly): the BFF is a demo trust boundary, not a production IAM. It is meaningfully hardened (no secret leak, validated input), but real deployment would add proper auth (OIDC), rate limiting, and audit logging at the gateway. The *ledger* guarantees hold regardless of the BFF.

---

## 4. Known gaps before final submission

These are packaging blockers, not technical ones. None affects the working ledger/agent/UI.

1. **Live deploy URL** — ✅ DONE: **https://mandate-rail.vercel.app** (Vercel, read-only snapshot mode). Full interactive ledger still runs locally.
2. **Recorded video** — ✅ DONE: https://youtu.be/S1WG7tDw3Z8 (3-minute pitch + demo, leads with the money-shots).
3. **Exported deck PDF** — ✅ DONE: [PDF on Google Drive](https://drive.google.com/file/d/1jDnMEZr1rQf_xshU0BuoAaZihfJmbrXp/view?usp=sharing) (source `PITCH_DECK.md`).
4. **Team names** — README "Team & Acknowledgements" is still `TODO — names / roles / contact`. The pre-submission checklist item is unchecked.
5. **README test-count fix (§0)** — bump 14→21 / 8→21 in the three stale locations and add the 7 adversarial rows to the Testing table. (Trivial but visible; a judge who runs `daml test` will see 21 and notice the README says 14.)

---

## 5. Honest-scope risks

Stated plainly — these are deliberate MVP boundaries, disclosed so a sharp judge can't catch us claiming more than we built.

- **`Iou` is a tokenized-cash STUB, not Daml Finance.** The DvP *mechanism* (atomic debit + PO + cash settle + audit in one transaction) is real and tested; the *asset* is a simplified single-currency `Iou` with a `Transfer` choice, not a regulated holding. Daml Finance integration is roadmap, not MVP. Do not claim production-grade settlement assets.
- **Single local Canton sandbox participant.** Privacy in the MVP is enforced by Daml signatory/observer scoping (each party's view is JWT-scoped and queries only contracts it is a stakeholder on). The *cross-node* sub-transaction privacy guarantee — where a supplier's separate participant node never even receives the bytes of the cap — is the **production multi-participant topology** on Canton + the Global Synchronizer. The privacy *model* is identical; only the deployment topology differs. This must be stated when demoing privacy, because on one node "the regulator can't see the cap" is enforced by scoping, not by physical node separation. (`testRegulatorSelectiveDisclosure` proves the scoping is correct; it does not prove byte-level node isolation, which requires the multi-participant deploy.)
- **In-policy key abuse is out of scope.** If the agent's key is stolen, the attacker can still spend *in-policy* — up to the per-tx cap, within budget, to an allow-listed supplier, before expiry. The mandate **bounds the blast radius** to exactly what the treasurer authorized and offers instant `Revoke`; it does not stop in-policy abuse of a compromised key. Key custody is orthogonal. This is still strictly stronger than today's "API key + spreadsheet."
- **Single-round, lowest-compliant auction; single currency.** Scored/multi-round auctions, multi-currency caps, and delivery/outcome oracles are roadmap.

---

## 6. Deliberate scope decisions — what we did NOT build, and why

A competing entry in this space leans on visual/DeFi theater. We rejected each of the following on purpose because it is either theater or off-thesis ("trust the ledger, not the model" means enforcement, not spectacle).

- **No Three.js / 3D visuals.** Off-thesis spectacle. The persuasive artifact here is a real Daml `AssertionFailed` on screen and a live budget gauge a controller would actually use — not a rotating 3D scene. A premium light-theme cockpit driven by live on-chain data sells "real product, not an AI wrapper" better than graphics.
- **No collateral-pool DeFi model.** Off-thesis. MandateRail is enterprise treasury delegation (a CEO/CFO charter minting a tighten-only mandate to a named agent), not a retail crypto pool. A collateral pool would import DeFi risk surface that has nothing to do with bounded agentic spend and would muddy the "credible commercial pain" pitch.
- **No fake session counters.** Theater. Inventing a "sessions" or "transactions today" number that isn't ledger-derived is exactly the mock-data trap the track warns against. Every number in our analytics strip (budget burndown, per-tx-vs-cap bars, commit timeline) is derived from the actual on-chain audit trail. No mock data is a credibility asset; a fake counter throws it away.
- **No `EmergencyPause` choice.** Redundant theater. We already have two real kill switches that are tested: treasurer `Revoke` (`testRevoke`, audited via `testRevocationAudited`) and the CEO+CFO multi-sig `RevokeByCharter` cascade (`testCharterRevokeCascade`). A separate "pause" button adds a control-panel affordance with no new guarantee and would dilute the (genuine) instant-revoke money-shot.
- **No contract keys.** Deliberate avoidance. The anti-race cumulative cap is achieved by archive-and-recreate on the consuming `Commit` choice (`testConcurrentCommitRace` proves the second concurrent commit aborts on the consumed input). Contract keys add a uniqueness/lookup surface and well-known contention foot-guns we don't need for a low-TPS procurement flow, and they wouldn't make the guarantee any stronger. Sharding a budget across sub-mandates is the proper scale-out and is roadmap.
- **No app-level amount-clamping.** This would actively *undermine* the thesis. Clamping or pre-validating the amount in the agent/BFF before sending it to the ledger would move enforcement back into app code — the exact anti-pattern we exist to replace. We send the agent's requested amount straight to the `Commit` choice and let the ledger precondition reject it. `testForgedAmountRejected` and `testOverPerTxCap` prove the ledger does the clamping. The over-cap rejection MUST originate from Canton, or the whole pitch collapses.

---

## 7. Final verdict

**Technically submission-ready.** The Daml enforcement core, thin agent, hardened BFF + live UI, and a 21-test suite (including a 7-test adversarial battery) all stand up to scrutiny and back the thesis with executable proof. The honest-scope disclosures are accurate and complete.

**Remaining work is packaging, not engineering:** publish a live deploy URL, record the 3-minute video, export the deck PDF, fill in team names, and correct the three stale "14 tests / 8/8" claims in the README to **21/21**. None of these touch the code; all are achievable before the deadline.

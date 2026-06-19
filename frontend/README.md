# MandateRail — Frontend

The 3-panel demo cockpit for **MandateRail** (Treasurer · Buyer Agent · Supplier), built with Next.js (App Router) + Tailwind. It talks to the Daml **JSON Ledger API** through a thin **backend-for-frontend** (route handlers under `app/api/`), so the browser never holds a token or sees a counterparty's data.

It is the visual layer for the Daml model in the parent [`MandateRail`](..) repo (this app lives at `MandateRail/frontend`).

## Architecture

```
Browser (client components)
  → /api/state | /api/commit | /api/revoke | /api/issue   (Next.js route handlers, server)
      → mints a per-party HS256 dev token (node:crypto)
      → Daml HTTP JSON API (daml start)  →  Canton sandbox
```

- **No CORS, no secrets in the browser.** Tokens are minted server-side per party.
- **Privacy is real, not faked.** `/api/state` queries the ledger *as each party*: the Treasurer sees the cap, the Supplier's query for the mandate returns `[]` (the cap never reaches its node).
- The **agent** action (`/api/commit`) uses an agent-only token — the ledger, not the app, enforces the mandate. Over-cap / off-allow-list commits come back as raw Daml `AssertionFailed` rejections.

## Prerequisites

1. The Daml ledger running from the repo root:
   ```bash
   cd .. && daml start      # JSON API on :7575, seeds the Bootstrap state
   ```
2. `.env.local` (already present) — note `DAML_PACKAGE_ID`:
   ```
   JSON_API_URL=http://localhost:7575
   LEDGER_SECRET=secret
   LEDGER_ID=sandbox
   APPLICATION_ID=mandaterail
   DAML_PACKAGE_ID=<main package id of the DAR>
   ```
   > **Regenerate `DAML_PACKAGE_ID` after any Daml change** (the package id is part of every template id):
   > ```bash
   > daml damlc inspect-dar --json ../.daml/dist/mandaterail-1.0.0.dar
   > # copy "main_package_id" into .env.local
   > ```

## Run

```bash
npm install
npm run dev        # http://localhost:3000
```

## The demo flow

1. **Treasurer → Issue / Reset mandate** — $50,000 cap, $10k/tx, suppliers A/B/C; the budget gauge fills.
2. **Agent → Commit cheapest** — awards Supplier A @ $9,000; one atomic tx debits the mandate (gauge → $41k), issues the PO, settles cash. Supplier A flips to **AUTHORIZED + FUNDED** — and still shows the cap as **NOT VISIBLE**.
3. **Agent → Try over-cap** — the ledger rejects with *"amount exceeds per-tx cap"*.
4. **Agent → Try off-list** — the ledger rejects with *"supplier not on allow-list"*.
5. **Treasurer → Revoke** — the mandate is archived; the agent is instantly powerless.

## Layout

```
app/
├── api/
│   ├── state/route.ts     # role-scoped snapshot (proves privacy)
│   ├── commit/route.ts    # agent commits: cheapest | overcap | offlist
│   ├── revoke/route.ts    # treasurer kill switch
│   └── issue/route.ts     # reset: archive all + re-seed
├── lib/
│   ├── daml.ts            # server-only JSON API client + HS256 token mint
│   ├── types.ts           # shared payload + API types
│   └── api.ts             # client fetch helpers
├── components/ui.tsx      # Card / Gauge / Chip / Button primitives
└── page.tsx               # the 3-panel dashboard (client)
scripts/verify.mjs         # one-off ledger/token sanity check
```

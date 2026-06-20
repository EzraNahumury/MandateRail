// All landing copy is derived from C:\Canton\README.md (MandateRail).
// Keep this the single source of truth for marketing content.

export const project = {
  name: "MandateRail",
  chain: "Canton",
  tagline: "Trust the ledger, not the model.",
  oneLiner: "Confidential, ledger-enforced spend mandates for agentic procurement on Canton.",
  track: "Payments, Neobanking & Agentic Commerce",
  repo: "https://github.com/EzraNahumury/MandateRail",
  demoHref: "/demo",
};

export const nav = [
  { label: "Product", href: "#product" },
  { label: "Use Cases", href: "#use-cases" },
  { label: "Technology", href: "#technology" },
  { label: "Docs", href: project.repo },
];

export const hero = {
  // three bold lines
  headline: ["Spend mandates,", "enforced by the ledger —", "not the model."],
  sub: "Enterprises want AI agents to buy routine inputs autonomously. Treasury says no — a spreadsheet of caps is no guarantee, and transacting would leak the company's budget to every supplier. MandateRail moves the guardrail off the AI and onto the Canton ledger.",
  primaryCta: { label: "Launch the demo", href: project.demoHref },
  secondaryCta: { label: "Read the docs", href: project.repo },
  stats: [
    { value: "21", label: "Daml tests passing" },
    { value: "1-tx", label: "atomic DvP settlement" },
    { value: "4-party", label: "need-to-know privacy" },
    { value: "$0", label: "cost to run" },
  ],
};

// Overlapping hero cards (no NFT art — these are MandateRail artifacts).
export const heroCards = [
  {
    kind: "Spend Mandate",
    title: "Cloud-Compute Mandate",
    meta: "Per-tx cap $10,000 · 3 approved suppliers",
    amount: "$50,000",
    badge: "ENFORCED",
    img: "/canton3.png",
  },
  {
    kind: "Sealed Quote",
    title: "Supplier A · sealed bid",
    meta: "Rivals never see this price",
    amount: "$9,000",
    badge: "PRIVATE",
    img: "/canton.png",
  },
  {
    kind: "Purchase Order",
    title: "Authorized + Funded",
    meta: "Cap & remaining budget: hidden",
    amount: "$9,000",
    badge: "ATOMIC",
    img: "/canton2.png",
  },
] as const;

export const ecosystem = [
  "Canton",
  "Daml",
  "Canton Foundation",
  "Daml Finance",
  "Global Synchronizer",
  "Ledger API",
];

export const useCases = {
  title: "Agentic procurement, made institutional",
  rows: [
    ["Agentic Procurement", "Sealed-Bid RFQ", "Spend Mandates", "Atomic DvP", "Treasury Delegation", "Tamper-proof Audit"],
    ["Anti-collusion Auctions", "Confidential Pricing", "Tokenized Cash", "Approved-Supplier Allow-list", "Instant Revoke", "Need-to-know Privacy"],
  ],
};

export const featured = {
  title: "Featured capabilities",
  items: [
    {
      title: "Ledger-Enforced Mandate",
      subtitle: "Caps, expiry & allow-list as Daml choice preconditions — not app code, not a prompt.",
      status: "Enforced",
      img: "/canton.png",
    },
    {
      title: "Sealed-Bid Auction",
      subtitle: "Each supplier's quote is visible only to it and the agent. No price-to-cap, no collusion.",
      status: "Private",
      img: "/canton3.png",
    },
    {
      title: "Atomic DvP Commit",
      subtitle: "Debit mandate + binding PO + tokenized cash settle in one transaction, or none at all.",
      status: "Atomic",
      img: "/canton2.png",
    },
    {
      title: "Instant Revoke",
      subtitle: "The treasurer archives the mandate and the agent's next action fails immediately.",
      status: "Bounded",
      img: "/canton.png",
    },
  ],
};

export const workflows = {
  title: "Key workflows",
  filters: ["Overview", "Workflow", "Tech"],
  items: [
    { name: "Issue Mandate", desc: "Treasurer sets caps, expiry & allow-list", metric: "Authority: On-ledger" },
    { name: "Sealed RFQ", desc: "Suppliers quote blind to each other", metric: "Privacy: Enabled" },
    { name: "Atomic Commit", desc: "Debit + PO + cash, one transaction", metric: "Settlement: Atomic" },
    { name: "Over-cap Rejection", desc: "Ledger blocks any spend over the cap", metric: "Guardrail: Ledger" },
    { name: "Off-list Rejection", desc: "Non-approved suppliers are refused", metric: "Policy: Enforced" },
    { name: "Instant Revoke", desc: "Kill switch — the agent goes powerless", metric: "Control: Instant" },
    { name: "Authorized + Funded", desc: "Supplier sees only its own slice", metric: "Disclosure: Need-to-know" },
    { name: "Per-party Audit", desc: "Non-repudiable, contract-scoped trail", metric: "Audit: Tamper-proof" },
  ],
};

export const explore = {
  title: "Explore the platform",
  tabs: [
    {
      key: "Overview",
      body: "MandateRail makes delegated spend authority a ledger primitive. A treasurer issues a Daml SpendMandate to an AI agent; the ledger — not the model — enforces every limit.",
    },
    {
      key: "Privacy",
      body: "Sub-transaction privacy is the commercial point. The cap and remaining budget are never stakeholders of the supplier, so they never reach its node. The supplier can't price up to a cap it can't see.",
    },
    {
      key: "Authority",
      body: "Per-transaction cap, cumulative budget, expiry and an approved-supplier allow-list are enforced as Daml choice preconditions. An over-budget or off-policy purchase is rejected by the ledger.",
    },
    {
      key: "Settlement",
      body: "On award, a single atomic transaction debits the mandate, creates a binding purchase order, and settles tokenized cash (DvP). All four effects commit together, or nothing does.",
    },
    {
      key: "Agent",
      body: "A real LLM (Ollama Cloud, gpt-oss:120b) reasons over the compliant quotes and writes an on-chain rationale — but the ledger STILL gates its output. A hallucinated or jailbroken pick is rejected by a Daml precondition, not trusted. The model advises; the ledger decides.",
    },
    {
      key: "Docs",
      body: "Daml contract model, sequence diagrams, the privacy/visibility matrix, the 3-minute demo script and a full Daml Script test suite — all in the repository README.",
    },
  ],
};

export const problemSolution = [
  {
    tag: "Problem",
    title: "Authority off-ledger, budgets leaked",
    body: "Today an agent's limits live in an API key plus a spreadsheet — no settlement-level guarantee, no tamper-proof trail. And to transact it must expose the budget, so every supplier prices to the cap.",
  },
  {
    tag: "Solution",
    title: "A mandate the agent can't break",
    body: "A Daml SpendMandate enforces caps, expiry and allow-list as preconditions; sealed bids keep suppliers blind; an atomic Commit bundles debit + PO + DvP cash. The supplier sees only 'Authorized + Funded'.",
  },
  {
    tag: "Why Canton",
    title: "Privacy and atomicity, on one ledger",
    body: "Need-to-know privacy across parties plus atomic multi-party settlement are Canton's hard differentiators. A transparent chain leaks the cap; a SaaS database can't settle trustlessly across counterparties.",
  },
];

export const howItWorks = {
  title: "How it works",
  steps: [
    { n: "01", title: "Issue", body: "Treasurer issues a SpendMandate — category, per-tx cap, $50k budget, expiry, approved suppliers." },
    { n: "02", title: "Sealed RFQ", body: "The agent opens a sealed-bid auction; suppliers quote blind. None can see the cap or each other." },
    { n: "03", title: "Atomic Commit", body: "The agent awards the cheapest compliant quote; one transaction debits, issues the PO and settles DvP." },
    { n: "04", title: "Revoke & Audit", body: "Off-policy buys are rejected at the ledger; the treasurer can revoke instantly and audit every action." },
  ],
};

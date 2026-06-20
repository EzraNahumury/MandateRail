// Shared types between the BFF route handlers and the client UI.

export interface MandatePayload {
  treasurer: string;
  agent: string;
  bank: string;
  mandateId: string;
  category: string;
  perTxCap: string;
  remainingBudget: string;
  expiry: string;
  approvedSuppliers: string[];
  allowAutoCommit: boolean;
}

export interface QuotePayload {
  supplier: string;
  agent: string;
  category: string;
  price: string;
}

export interface POPayload {
  agent: string;
  supplier: string;
  category: string;
  amount: string;
  status: string;
}

export interface IouPayload {
  bank: string;
  owner: string;
  amount: string;
  observers: string[];
}

export interface AuditPayload {
  treasurer: string;
  agent: string;
  regulator: string;
  mandateId: string;
  category: string;
  supplier: string;
  amount: string;
  underPerTxCap: boolean;
  underBudget: boolean;
  supplierApproved: boolean;
  categoryMatch: boolean;
  notExpired: boolean;
  humanApproved: boolean;
  committedAt: string;
  agentNote: string;
}

export interface ApprovalPayload {
  treasurer: string;
  agent: string;
  regulator: string;
  supplier: string;
  amount: string;
  category: string;
  reason: string;
}

export interface AuditEntry {
  supplier: string;
  amount: string;
  category: string;
  mandateId: string;
  committedAt: string;
  agentNote: string;
  humanApproved: boolean;
  checks: { label: string; pass: boolean }[];
}

export interface RevocationPayload {
  mandateId: string;
  revokedBy: string;
  role: string;
  reason: string;
  regulator: string;
  at: string;
}

export interface RevocationEntry {
  mandateId: string;
  revokedBy: string;
  role: string;
  reason: string;
  at: string;
}

export type QuoteKind = "compliant" | "over-cap" | "off-list";

export interface SupplierView {
  key: string; // "a" | "b" | "c"
  label: string;
  canSeeMandate: boolean;
  ownQuotes: { price: string }[];
  purchaseOrder: { amount: string; status: string } | null;
}

export interface CharterPayload {
  ceo: string;
  cfo: string;
  treasurer: string;
  regulator: string;
  ceilingPerTxCap: string;
  ceilingBudget: string;
}

export interface StateSnapshot {
  mode?: "live" | "snapshot";
  treasurer: {
    mandate: {
      mandateId: string;
      category: string;
      perTxCap: string;
      remainingBudget: string;
      approvedSuppliers: string[];
      expiry: string;
      allowAutoCommit: boolean;
    } | null;
    charter: { ceilingPerTxCap: string; ceilingBudget: string } | null;
    pendingApprovals: { supplier: string; amount: string; category: string; reason: string }[];
  };
  agent: {
    hasMandate: boolean;
    remainingBudget: string | null;
    perTxCap: string | null;
    quotes: { supplier: string; price: string; kind: QuoteKind }[];
    purchaseOrders: { supplier: string; amount: string; status: string }[];
    auditTrail: AuditEntry[];
  };
  suppliers: SupplierView[];
  regulator: {
    canSeeMandate: boolean;
    canSeeQuotes: boolean;
    purchaseOrders: { supplier: string; amount: string; status: string }[];
    auditTrail: AuditEntry[];
    revocations: RevocationEntry[];
  };
}

export type CommitMode = "cheapest" | "overcap" | "offlist";

export interface CommitResponse {
  ok: boolean;
  mode?: string;
  supplier?: string;
  amount?: string;
  rejected?: boolean;
  reason?: string;
  error?: string;
}

export interface EscalateResponse {
  ok: boolean;
  supplier?: string;
  amount?: string;
  error?: string;
}

export interface ApprovalActionResponse {
  ok: boolean;
  supplier?: string;
  amount?: string;
  rejected?: boolean;
  reason?: string;
  error?: string;
}

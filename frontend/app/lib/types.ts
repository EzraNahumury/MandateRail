// Shared types between the BFF route handlers and the client UI.

export interface MandatePayload {
  treasurer: string;
  agent: string;
  bank: string;
  category: string;
  perTxCap: string;
  remainingBudget: string;
  expiry: string;
  approvedSuppliers: string[];
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
  category: string;
  supplier: string;
  amount: string;
  underPerTxCap: boolean;
  underBudget: boolean;
  supplierApproved: boolean;
  categoryMatch: boolean;
  notExpired: boolean;
  committedAt: string;
  agentNote: string;
}

export interface AuditEntry {
  supplier: string;
  amount: string;
  category: string;
  committedAt: string;
  agentNote: string;
  checks: { label: string; pass: boolean }[];
}

export type QuoteKind = "compliant" | "over-cap" | "off-list";

export interface CharterPayload {
  ceo: string;
  cfo: string;
  treasurer: string;
  regulator: string;
  ceilingPerTxCap: string;
  ceilingBudget: string;
}

export interface StateSnapshot {
  treasurer: {
    mandate: {
      category: string;
      perTxCap: string;
      remainingBudget: string;
      approvedSuppliers: string[];
      expiry: string;
    } | null;
    charter: { ceilingPerTxCap: string; ceilingBudget: string } | null;
  };
  agent: {
    hasMandate: boolean;
    remainingBudget: string | null;
    perTxCap: string | null;
    quotes: { supplier: string; price: string; kind: QuoteKind }[];
    purchaseOrders: { supplier: string; amount: string; status: string }[];
    auditTrail: AuditEntry[];
  };
  supplier: {
    label: string;
    canSeeMandate: boolean;
    ownQuote: { price: string } | null;
    purchaseOrder: { amount: string; status: string } | null;
  };
  regulator: {
    canSeeMandate: boolean;
    canSeeQuotes: boolean;
    purchaseOrders: { supplier: string; amount: string; status: string }[];
    auditTrail: AuditEntry[];
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

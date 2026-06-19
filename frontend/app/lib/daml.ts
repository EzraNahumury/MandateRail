// Server-only Daml JSON Ledger API client (the BFF layer).
// Mints HS256 dev tokens with node:crypto, talks to the JSON API over fetch.
// Never import this from a Client Component — it must stay on the server.
import crypto from "node:crypto";

const JSON_API = (process.env.JSON_API_URL ?? "http://localhost:7575").replace(/\/+$/, "");
const SECRET = process.env.LEDGER_SECRET ?? "secret";
const LEDGER_ID = process.env.LEDGER_ID ?? "sandbox";
const APP = process.env.APPLICATION_ID ?? "mandaterail";
const PKG = process.env.DAML_PACKAGE_ID ?? "";

/** Fully-qualified template ids (the JSON API requires <pkgId>:<module>:<entity>). */
export const TID = {
  mandate: `${PKG}:MandateRail.Mandate:SpendMandate`,
  quote: `${PKG}:MandateRail.Rfq:RfqQuote`,
  po: `${PKG}:MandateRail.Purchase:PurchaseOrder`,
  iou: `${PKG}:MandateRail.Cash:Iou`,
  audit: `${PKG}:MandateRail.Audit:AuditRecord`,
  charter: `${PKG}:MandateRail.Charter:TreasuryCharter`,
};

const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");

export function mintToken(actAs: string[], opts: { admin?: boolean } = {}): string {
  const header = b64({ alg: "HS256", typ: "JWT" });
  const payload = b64({
    "https://daml.com/ledger-api": {
      ledgerId: LEDGER_ID,
      applicationId: APP,
      actAs,
      readAs: actAs,
      admin: opts.admin ?? false,
    },
  });
  const sig = crypto
    .createHmac("sha256", SECRET)
    .update(`${header}.${payload}`)
    .digest("base64url");
  return `${header}.${payload}.${sig}`;
}

async function call(
  path: string,
  token: string,
  method: "GET" | "POST",
  body?: unknown,
): Promise<{ status?: number; result?: unknown; errors?: string[] }> {
  const res = await fetch(`${JSON_API}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({ status: res.status, errors: [`HTTP ${res.status}`] }));
  if ((json.status ?? res.status) >= 400) {
    const msg = Array.isArray(json.errors) ? json.errors.join("; ") : `HTTP ${res.status}`;
    const err = new Error(msg) as Error & { status?: number };
    err.status = json.status ?? res.status;
    throw err;
  }
  return json;
}

export interface Contract<T> {
  contractId: string;
  templateId: string;
  payload: T;
}

export async function query<T>(token: string, templateIds: string[]): Promise<Contract<T>[]> {
  const json = await call("/v1/query", token, "POST", { templateIds });
  return (json.result ?? []) as Contract<T>[];
}

export async function exercise(
  token: string,
  templateId: string,
  contractId: string,
  choice: string,
  argument: unknown,
): Promise<unknown> {
  const json = await call("/v1/exercise", token, "POST", { templateId, contractId, choice, argument });
  return json.result;
}

export async function create(token: string, templateId: string, payload: unknown): Promise<unknown> {
  const json = await call("/v1/create", token, "POST", { templateId, payload });
  return json.result;
}

// --- party discovery (display name -> full party id), cached per server process ---
interface PartyInfo {
  identifier: string;
  displayName?: string;
}
let partyCache: { byName: Record<string, string>; byId: Record<string, string> } | null = null;

export async function parties(): Promise<{ byName: Record<string, string>; byId: Record<string, string> }> {
  if (partyCache) return partyCache;
  const json = await call("/v1/parties", mintToken([], { admin: true }), "GET");
  const byName: Record<string, string> = {};
  const byId: Record<string, string> = {};
  for (const p of (json.result ?? []) as PartyInfo[]) {
    if (p.displayName) {
      byName[p.displayName] = p.identifier;
      byId[p.identifier] = p.displayName;
    }
  }
  partyCache = { byName, byId };
  return partyCache;
}

export function clearPartyCache(): void {
  partyCache = null;
}

/** Extract the human-readable Daml assertion message from a ledger error. */
export function ledgerReason(message?: string): string {
  if (!message) return "rejected by the ledger";
  const m = message.match(/message = "([^"]+)"/);
  return m ? m[1] : message.replace(/\s+/g, " ").slice(0, 180);
}

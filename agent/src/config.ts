import jwt from "jsonwebtoken";

const RAW_URL = process.env.LEDGER_URL ?? "http://localhost:7575";
// @daml/ledger requires the base URL to end with a trailing slash.
export const LEDGER_URL = RAW_URL.endsWith("/") ? RAW_URL : `${RAW_URL}/`;
export const APPLICATION_ID = process.env.APPLICATION_ID ?? "mandaterail";

const SECRET = process.env.LEDGER_SECRET ?? "secret";
// `daml start` (Canton sandbox) requires a ledgerId claim; "sandbox" is its default.
const LEDGER_ID = process.env.LEDGER_ID ?? "sandbox";

interface LedgerClaims {
  applicationId: string;
  actAs: string[];
  readAs: string[];
  admin?: boolean;
  ledgerId?: string;
}

function sign(claims: LedgerClaims): string {
  if (LEDGER_ID) claims.ledgerId = LEDGER_ID;
  return jwt.sign({ "https://daml.com/ledger-api": claims }, SECRET, {
    algorithm: "HS256",
  });
}

/** Dev token that acts/reads as the given party. */
export function tokenFor(party: string): string {
  return sign({ applicationId: APPLICATION_ID, actAs: [party], readAs: [party] });
}

/** Admin-ish token used only to list known parties for discovery. */
export function adminToken(): string {
  return sign({ applicationId: APPLICATION_ID, actAs: [], readAs: [], admin: true });
}

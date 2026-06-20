import "dotenv/config";
import jwt from "jsonwebtoken";

const RAW_URL = process.env.LEDGER_URL ?? "http://localhost:7575";
// @daml/ledger requires the base URL to end with a trailing slash.
export const LEDGER_URL = RAW_URL.endsWith("/") ? RAW_URL : `${RAW_URL}/`;
export const APPLICATION_ID = process.env.APPLICATION_ID ?? "mandaterail";

const SECRET = process.env.LEDGER_SECRET ?? "secret";
// `daml start` (Canton sandbox) requires a ledgerId claim; "sandbox" is its default.
const LEDGER_ID = process.env.LEDGER_ID ?? "sandbox";

// Fail fast in production if the dev signing secret was never overridden — the
// literal "secret" default lets anyone forge an admin token. The localhost demo
// keeps the default; only production refuses to boot.
if (process.env.NODE_ENV === "production" && (!process.env.LEDGER_SECRET || SECRET === "secret")) {
  throw new Error(
    "LEDGER_SECRET must be set to a strong value in production (the default 'secret' allows token forgery).",
  );
}

// --- LLM reasoning (optional). The agent runs fully WITHOUT a key (deterministic
// cheapest-compliant fallback); with an OLLAMA_KEY it adds a real model rationale
// via Ollama Cloud. The model NEVER has enforcement authority — the ledger does. ---
export const OLLAMA_HOST = (process.env.OLLAMA_HOST ?? "https://ollama.com").replace(/\/+$/, "");
export const OLLAMA_KEY = process.env.OLLAMA_KEY ?? "";
export const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "gpt-oss:120b-cloud";
export const LLM_TIMEOUT_MS = Number(process.env.LLM_TIMEOUT_MS ?? "30000");

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

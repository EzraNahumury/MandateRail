import type { StateSnapshot, CommitMode, CommitResponse } from "./types";

export async function fetchState(): Promise<StateSnapshot> {
  const r = await fetch("/api/state", { cache: "no-store" });
  const json = await r.json();
  if (!r.ok) throw new Error(json.error ?? "Failed to load ledger state");
  return json as StateSnapshot;
}

export async function postCommit(mode: CommitMode): Promise<CommitResponse> {
  const r = await fetch("/api/commit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode }),
  });
  return (await r.json()) as CommitResponse;
}

export async function postRevoke(): Promise<{ ok: boolean; error?: string }> {
  const r = await fetch("/api/revoke", { method: "POST" });
  return r.json();
}

export async function postIssue(): Promise<{ ok: boolean; error?: string }> {
  const r = await fetch("/api/issue", { method: "POST" });
  return r.json();
}

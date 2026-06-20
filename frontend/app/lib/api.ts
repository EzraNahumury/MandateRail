import type {
  StateSnapshot,
  CommitMode,
  CommitResponse,
  EscalateResponse,
  ApprovalActionResponse,
} from "./types";

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

export async function postEscalate(): Promise<EscalateResponse> {
  const r = await fetch("/api/escalate", { method: "POST" });
  return (await r.json()) as EscalateResponse;
}

export async function postApprove(): Promise<ApprovalActionResponse> {
  const r = await fetch("/api/approve", { method: "POST" });
  return (await r.json()) as ApprovalActionResponse;
}

export async function postReject(): Promise<ApprovalActionResponse> {
  const r = await fetch("/api/reject", { method: "POST" });
  return (await r.json()) as ApprovalActionResponse;
}

export async function postConfirm(): Promise<ApprovalActionResponse> {
  const r = await fetch("/api/confirm", { method: "POST" });
  return (await r.json()) as ApprovalActionResponse;
}

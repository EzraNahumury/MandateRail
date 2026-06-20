"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { money } from "@/app/components/ui";

// A persistent left rail that reads as a product, not a single scrolling column.
// It shows the CURRENT signed-in identity (no role switcher — you enter as one
// party) plus a LIVE active-mandate card that ticks on the state poll. It is
// privacy-aware: for a supplier/regulator session the cap & budget are withheld
// exactly as they are on-ledger.

export interface SidebarMandate {
  mandateId: string;
  category: string;
  expiry: string;
  remainingBudget: string;
  allowAutoCommit: boolean;
}

export function Sidebar(props: {
  roleLabel: string;
  roleIcon: ReactNode;
  roleChip: string;
  connected: boolean;
  mandate: SidebarMandate | null;
  showBudget: boolean;
  pendingCount: number;
  onLogout: () => void;
}) {
  const { roleLabel, roleIcon, roleChip, connected, mandate, showBudget, pendingCount, onLogout } = props;
  return (
    <aside className="hidden w-[230px] flex-shrink-0 flex-col gap-5 border-r border-neutral-200 pr-5 lg:flex">
      {/* brand */}
      <Link href="/" className="flex items-center gap-2.5">
        <Image
          src="/logo.png"
          alt="MandateRail"
          width={30}
          height={30}
          className="h-7 w-7 rounded-full object-cover ring-1 ring-neutral-200"
        />
        <span className="text-base font-bold tracking-tight text-neutral-900">MandateRail</span>
      </Link>

      {/* signed-in identity */}
      <div className="rounded-xl border border-neutral-200 bg-white p-3 shadow-sm">
        <div className="flex items-center gap-2.5">
          <span className={`grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg ring-1 ${roleChip}`}>
            {roleIcon}
          </span>
          <div className="min-w-0">
            <div className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">Signed in</div>
            <div className="truncate text-sm font-semibold text-neutral-900">{roleLabel}</div>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-1.5 border-t border-neutral-100 pt-2.5 text-[11px]">
          <span className={`h-1.5 w-1.5 rounded-full ${connected ? "animate-pulse bg-emerald-500" : "bg-red-500"}`} />
          <span className={connected ? "text-emerald-600" : "text-red-600"}>
            {connected ? "ledger live" : "disconnected"}
          </span>
          {showBudget && pendingCount > 0 && (
            <span className="ml-auto rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 ring-1 ring-amber-200">
              {pendingCount} to approve
            </span>
          )}
        </div>
      </div>

      {/* live active mandate */}
      <div className="rounded-xl border border-neutral-200 bg-white p-3 shadow-sm">
        <div className="mb-2 text-[10px] font-medium uppercase tracking-wider text-neutral-400">Active mandate</div>
        {mandate ? (
          <div className="space-y-2">
            <div className="font-mono text-xs font-semibold text-neutral-900">{mandate.mandateId}</div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-neutral-500">Category</span>
              <span className="font-medium text-neutral-800">{mandate.category}</span>
            </div>
            {showBudget ? (
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-neutral-500">Remaining</span>
                <span className="font-mono font-semibold text-emerald-600">${money(mandate.remainingBudget)}</span>
              </div>
            ) : (
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-neutral-500">Budget</span>
                <span className="font-medium text-neutral-400">🔒 private</span>
              </div>
            )}
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-neutral-500">Expires</span>
              <span className="font-medium text-neutral-800">{new Date(mandate.expiry).toLocaleDateString()}</span>
            </div>
            <div className="flex flex-wrap gap-1 pt-0.5">
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ring-1 ${
                  mandate.allowAutoCommit
                    ? "bg-violet-50 text-violet-700 ring-violet-200"
                    : "bg-neutral-100 text-neutral-600 ring-neutral-200"
                }`}
              >
                {mandate.allowAutoCommit ? "auto-commit ON" : "escalate-only"}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-neutral-400">No active mandate.</p>
        )}
      </div>

      <button
        onClick={onLogout}
        className="mt-auto inline-flex items-center justify-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
      >
        Log out
      </button>
    </aside>
  );
}

"use client";

/**
 * On-chain workspace storage using Stellar account data entries.
 *
 * Layout (all keys are 64-byte max, all values are 64-byte max):
 *   vw{slot}         → workspace name (up to 64 bytes)
 *   vw{slot}d        → workspace description (optional, 64 bytes)
 *   vw{slot}p{planId} → empty value, presence = plan belongs to slot
 *
 * Slots are small non-negative integers assigned at creation time. They are
 * stable as long as the workspace isn't deleted.
 *
 * Reads use Horizon directly (no wallet needed). Writes build a standard
 * Stellar tx with ManageData ops, sign with the connected wallet, submit.
 */

import {
  Account,
  TransactionBuilder,
  Operation,
  Networks,
  BASE_FEE,
} from "@stellar/stellar-sdk";

const HORIZON_URL = "https://horizon-testnet.stellar.org";
const PASSPHRASE = Networks.TESTNET;

export interface OnChainWorkspace {
  slot: number;
  name: string;
  description?: string;
  planIds: number[];
  merchantAddress: string;
}

interface HorizonAccount {
  sequence: string;
  /** Raw Horizon JSON uses `data` (not `data_attr` which is an SDK alias). */
  data?: Record<string, string>;
}

async function fetchAccount(address: string): Promise<HorizonAccount> {
  // Cache-bust so we never get stale account data right after a write.
  const res = await fetch(`${HORIZON_URL}/accounts/${address}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    if (res.status === 404) {
      // Account doesn't exist (unfunded). Treat as empty.
      return { sequence: "0", data: {} };
    }
    throw new Error(`Horizon fetch failed: ${res.status}`);
  }
  return res.json();
}

function decodeB64(value: string): string {
  if (typeof window !== "undefined") {
    try {
      // Base64 -> binary string -> UTF-8
      return decodeURIComponent(escape(atob(value)));
    } catch {
      return atob(value);
    }
  }
  return Buffer.from(value, "base64").toString("utf8");
}

/**
 * Read all workspaces (and their plan tags) from the merchant's account data.
 */
export async function readWorkspaces(
  address: string,
): Promise<OnChainWorkspace[]> {
  try {
    const account = await fetchAccount(address);
    const data: Record<string, string> = account.data || {};
    const workspaces = new Map<number, OnChainWorkspace>();

    // Pass 1: find workspace names — match `vw{slot}` but NOT `vw{slot}d` or `vw{slot}p*`
    for (const [key, value] of Object.entries(data)) {
      const match = key.match(/^vw(\d+)$/);
      if (match) {
        const slot = parseInt(match[1], 10);
        workspaces.set(slot, {
          slot,
          name: decodeB64(value),
          planIds: [],
          merchantAddress: address,
        });
      }
    }

    // Pass 2: descriptions
    for (const [key, value] of Object.entries(data)) {
      const match = key.match(/^vw(\d+)d$/);
      if (match) {
        const slot = parseInt(match[1], 10);
        const ws = workspaces.get(slot);
        if (ws) ws.description = decodeB64(value);
      }
    }

    // Pass 3: plan tags
    for (const [key] of Object.entries(data)) {
      const match = key.match(/^vw(\d+)p(\d+)$/);
      if (match) {
        const slot = parseInt(match[1], 10);
        const planId = parseInt(match[2], 10);
        const ws = workspaces.get(slot);
        if (ws) ws.planIds.push(planId);
      }
    }

    return Array.from(workspaces.values()).sort((a, b) => a.slot - b.slot);
  } catch (err) {
    console.error("readWorkspaces failed:", err);
    return [];
  }
}

/**
 * Find the smallest unused slot number.
 */
function nextSlot(existing: OnChainWorkspace[]): number {
  const used = new Set(existing.map((w) => w.slot));
  let i = 0;
  while (used.has(i)) i++;
  return i;
}

/**
 * Build an unsigned Stellar tx that creates a workspace (name + optional desc).
 * Also returns the slot that will be assigned.
 *
 * Pass `existingWorkspaces` from the react-query cache to skip an extra
 * Horizon read on every create.
 */
export async function buildCreateWorkspaceTx(
  address: string,
  name: string,
  description?: string,
  existingWorkspaces?: OnChainWorkspace[],
): Promise<{ xdr: string; slot: number }> {
  const existing = existingWorkspaces ?? (await readWorkspaces(address));
  const slot = nextSlot(existing);

  const account = await fetchAccount(address);
  if (account.sequence === "0") {
    throw new Error(
      "Account not found or unfunded. Fund your wallet with testnet XLM first.",
    );
  }

  const source = new Account(address, account.sequence);

  const builder = new TransactionBuilder(source, {
    fee: BASE_FEE,
    networkPassphrase: PASSPHRASE,
  }).addOperation(
    Operation.manageData({
      name: `vw${slot}`,
      value: truncateUtf8(name, 64),
    }),
  );

  if (description && description.trim()) {
    builder.addOperation(
      Operation.manageData({
        name: `vw${slot}d`,
        value: truncateUtf8(description, 64),
      }),
    );
  }

  const tx = builder.setTimeout(30).build();
  return { xdr: tx.toXDR(), slot };
}

/**
 * Build an unsigned Stellar tx that tags a plan to a workspace slot.
 */
export async function buildTagPlanTx(
  address: string,
  planId: number,
  slot: number,
): Promise<string> {
  const account = await fetchAccount(address);
  const source = new Account(address, account.sequence);

  const tx = new TransactionBuilder(source, {
    fee: BASE_FEE,
    networkPassphrase: PASSPHRASE,
  })
    .addOperation(
      Operation.manageData({
        name: `vw${slot}p${planId}`,
        value: "1",
      }),
    )
    .setTimeout(30)
    .build();

  return tx.toXDR();
}

/**
 * Build a tx to delete a workspace (removes name, desc, and all plan tags).
 */
export async function buildDeleteWorkspaceTx(
  address: string,
  slot: number,
): Promise<string> {
  const existing = await readWorkspaces(address);
  const ws = existing.find((w) => w.slot === slot);
  if (!ws) throw new Error("Workspace not found");

  const account = await fetchAccount(address);
  const source = new Account(address, account.sequence);

  const builder = new TransactionBuilder(source, {
    fee: BASE_FEE,
    networkPassphrase: PASSPHRASE,
  })
    .addOperation(Operation.manageData({ name: `vw${slot}`, value: null }))
    .addOperation(Operation.manageData({ name: `vw${slot}d`, value: null }));

  for (const planId of ws.planIds) {
    builder.addOperation(
      Operation.manageData({ name: `vw${slot}p${planId}`, value: null }),
    );
  }

  return builder.setTimeout(30).build().toXDR();
}

/**
 * Submit a signed tx to Horizon and wait for inclusion.
 */
export async function submitToHorizon(signedXdr: string): Promise<{ hash: string }> {
  const res = await fetch(`${HORIZON_URL}/transactions`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `tx=${encodeURIComponent(signedXdr)}`,
  });

  const body = await res.json();
  if (!res.ok) {
    const reason =
      body?.extras?.result_codes?.transaction ||
      body?.extras?.result_codes?.operations?.join(", ") ||
      body?.detail ||
      body?.title ||
      "Transaction failed";
    throw new Error(`Stellar: ${reason}`);
  }
  return { hash: body.hash };
}

/**
 * Truncate a UTF-8 string so its byte length <= max bytes.
 */
function truncateUtf8(str: string, max: number): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  if (bytes.length <= max) return str;
  // Cut at max bytes, avoid splitting a multi-byte char
  let cutoff = max;
  while (cutoff > 0 && (bytes[cutoff] & 0xc0) === 0x80) cutoff--;
  return new TextDecoder().decode(bytes.slice(0, cutoff));
}

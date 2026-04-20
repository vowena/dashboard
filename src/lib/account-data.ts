"use client";

/**
 * On-chain project storage using Stellar account data entries.
 *
 * Layout (all keys are 64-byte max, all values are 64-byte max):
 *   vw{slot}         → project name (up to 64 bytes)
 *   vw{slot}d        → project description (optional, 64 bytes)
 *   vw{slot}p{planId} → empty value, presence = plan belongs to slot
 *
 * Slots are small non-negative integers assigned at creation time. They are
 * stable as long as the project isn't deleted.
 *
 * Reads use Horizon directly (no wallet needed). Writes build a standard
 * Stellar tx with ManageData ops, sign with the connected wallet, submit.
 */

import {
  Account,
  Asset,
  TransactionBuilder,
  Operation,
  Networks,
  BASE_FEE,
} from "@stellar/stellar-sdk";

const HORIZON_URL = "https://horizon-testnet.stellar.org";
const PASSPHRASE = Networks.TESTNET;

/** Stellar testnet TUSDC issuer */
export const TUSDC_ISSUER =
  "GBAINHPXCOOQMUYL5AEOMLIXDDQJOMYPIO4KZXXSUSHMZWQVIQA4CFQV";
export const TUSDC_CODE = "TUSDC";

/**
 * Check if a Stellar account has an established trustline for the given
 * asset (issuer + code).
 */
export async function hasTrustline(
  address: string,
  assetCode: string,
  assetIssuer: string,
): Promise<boolean> {
  try {
    const account = await fetchAccount(address);
    const balances =
      (account as unknown as {
        balances?: Array<{
          asset_code?: string;
          asset_issuer?: string;
          asset_type?: string;
        }>;
      }).balances || [];
    return balances.some(
      (b) =>
        b.asset_code === assetCode && b.asset_issuer === assetIssuer,
    );
  } catch {
    return false;
  }
}

/**
 * Build an unsigned tx that establishes a trustline from the user's account
 * to the given asset. Useful for first-time subscribers who need a USDC
 * trustline before they can be debited.
 */
export async function buildTrustlineTx(
  address: string,
  assetCode: string,
  assetIssuer: string,
): Promise<string> {
  const account = await fetchAccount(address);
  if (account.sequence === "0") {
    throw new Error("Account not found or unfunded.");
  }
  const source = new Account(address, account.sequence);
  const tx = new TransactionBuilder(source, {
    fee: BASE_FEE,
    networkPassphrase: PASSPHRASE,
  })
    .addOperation(
      Operation.changeTrust({
        asset: new Asset(assetCode, assetIssuer),
      }),
    )
    .setTimeout(30)
    .build();
  return tx.toXDR();
}

export interface OnChainProject {
  slot: number;
  name: string;
  description?: string;
  planIds: number[];
  /** plan_id -> plan name (read from vw{slot}n{planId} entries) */
  planNames: Record<number, string>;
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
 * Read all projects (and their plan tags) from the merchant's account data.
 */
export async function readProjects(
  address: string,
): Promise<OnChainProject[]> {
  try {
    const account = await fetchAccount(address);
    const data: Record<string, string> = account.data || {};
    const projects = new Map<number, OnChainProject>();

    // Pass 1: find project names — match `vw{slot}` but NOT `vw{slot}d` or `vw{slot}p*` or `vw{slot}n*`
    for (const [key, value] of Object.entries(data)) {
      const match = key.match(/^vw(\d+)$/);
      if (match) {
        const slot = parseInt(match[1], 10);
        projects.set(slot, {
          slot,
          name: decodeB64(value),
          planIds: [],
          planNames: {},
          merchantAddress: address,
        });
      }
    }

    // Pass 2: descriptions
    for (const [key, value] of Object.entries(data)) {
      const match = key.match(/^vw(\d+)d$/);
      if (match) {
        const slot = parseInt(match[1], 10);
        const ws = projects.get(slot);
        if (ws) ws.description = decodeB64(value);
      }
    }

    // Pass 3: plan tags (vw{slot}p{planId}) and plan names (vw{slot}n{planId})
    for (const [key, value] of Object.entries(data)) {
      const tagMatch = key.match(/^vw(\d+)p(\d+)$/);
      if (tagMatch) {
        const slot = parseInt(tagMatch[1], 10);
        const planId = parseInt(tagMatch[2], 10);
        const ws = projects.get(slot);
        if (ws) ws.planIds.push(planId);
        continue;
      }
      const nameMatch = key.match(/^vw(\d+)n(\d+)$/);
      if (nameMatch) {
        const slot = parseInt(nameMatch[1], 10);
        const planId = parseInt(nameMatch[2], 10);
        const ws = projects.get(slot);
        if (ws) ws.planNames[planId] = decodeB64(value);
      }
    }

    return Array.from(projects.values()).sort((a, b) => a.slot - b.slot);
  } catch (err) {
    console.error("readProjects failed:", err);
    return [];
  }
}

/**
 * Find the smallest unused slot number.
 */
function nextSlot(existing: OnChainProject[]): number {
  const used = new Set(existing.map((w) => w.slot));
  let i = 0;
  while (used.has(i)) i++;
  return i;
}

/**
 * Build an unsigned Stellar tx that creates a project (name + optional desc).
 * Also returns the slot that will be assigned.
 *
 * Pass `existingProjects` from the react-query cache to skip an extra
 * Horizon read on every create.
 */
export async function buildCreateProjectTx(
  address: string,
  name: string,
  description?: string,
  existingProjects?: OnChainProject[],
): Promise<{ xdr: string; slot: number }> {
  const existing = existingProjects ?? (await readProjects(address));
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
 * Build an unsigned Stellar tx that tags a plan to a project slot AND
 * stores the plan's display name in account data — both in a single tx
 * so the merchant only signs once.
 */
export async function buildTagAndNamePlanTx(
  address: string,
  planId: number,
  slot: number,
  planName: string,
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
    .addOperation(
      Operation.manageData({
        name: `vw${slot}n${planId}`,
        value: truncateUtf8(planName, 64),
      }),
    )
    .setTimeout(30)
    .build();

  return tx.toXDR();
}

/**
 * Build a tx to delete a project (removes name, desc, and all plan tags).
 */
export async function buildDeleteProjectTx(
  address: string,
  slot: number,
): Promise<string> {
  const existing = await readProjects(address);
  const ws = existing.find((w) => w.slot === slot);
  if (!ws) throw new Error("Project not found");

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
    if (ws.planNames[planId]) {
      builder.addOperation(
        Operation.manageData({ name: `vw${slot}n${planId}`, value: null }),
      );
    }
  }

  return builder.setTimeout(30).build().toXDR();
}

/**
 * Submit a signed tx to Horizon and wait for inclusion.
 */
export async function submitToHorizon(
  signedXdr: string,
): Promise<{ hash: string }> {
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

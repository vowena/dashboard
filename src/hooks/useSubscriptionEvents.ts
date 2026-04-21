"use client";

import { useQuery } from "@tanstack/react-query";
import { getEvents, type VowenaEvent } from "@vowena/sdk";
import { CONTRACT } from "@/lib/chain";
import { rpc as SorobanRpc } from "@stellar/stellar-sdk";

export interface SubscriptionEvent {
  type: string;
  timestamp: number;
  ledger: number;
  amount?: number;
  /** Stellar transaction hash for stellar.expert linkout */
  txHash?: string;
  raw: VowenaEvent;
}

const server = new SorobanRpc.Server(CONTRACT.RPC_URL);

/**
 * Fetch the event history for a single subscription by walking recent
 * Soroban events and filtering by sub_id.
 *
 * Soroban RPC retains events for ~24h on testnet; we query the most recent
 * window and filter client-side. For longer history, a dedicated indexer
 * would be needed.
 */
export function useSubscriptionEvents(subId: number | null) {
  return useQuery({
    queryKey: ["subscription-events", subId],
    queryFn: async (): Promise<SubscriptionEvent[]> => {
      if (subId == null) return [];

      // Get the actual current ledger from RPC instead of guessing
      const latest = await server.getLatestLedger();
      const start = Math.max(1, latest.sequence - 17_280); // ~24h on testnet

      const { events } = await getEvents(
        CONTRACT.RPC_URL,
        CONTRACT.ID,
        start,
        1000,
      );

      const matched: SubscriptionEvent[] = [];
      for (const ev of events) {
        if (!eventMentionsSubId(ev, subId)) continue;
        matched.push({
          type: inferEventType(ev),
          timestamp: ev.timestamp,
          ledger: ev.ledger,
          amount: extractAmount(ev),
          txHash: extractTxHash(ev),
          raw: ev,
        });
      }

      return matched.sort((a, b) => b.timestamp - a.timestamp);
    },
    enabled: subId != null,
    staleTime: 10_000,
    refetchInterval: 15_000, // poll every 15s so the timeline stays live
  });
}

function eventMentionsSubId(ev: VowenaEvent, subId: number): boolean {
  const topics = ev.topics ?? [];
  for (const t of topics) {
    if (t == null) continue;
    if (typeof t === "number" && t === subId) return true;
    if (typeof t === "bigint" && Number(t) === subId) return true;
    if (typeof t === "string" && /^\d+$/.test(t) && Number(t) === subId) {
      return true;
    }
    const maybe = t as { u64?: () => bigint };
    try {
      if (typeof maybe?.u64 === "function" && Number(maybe.u64()) === subId) {
        return true;
      }
    } catch {
      // not a u64 ScVal
    }
  }
  // Fallback: check the data payload for the sub_id reference
  try {
    const asString = JSON.stringify(ev.data);
    if (
      asString.includes(`"${subId}"`) ||
      asString.includes(`:${subId},`) ||
      asString.includes(`:${subId}}`)
    ) {
      return true;
    }
  } catch {
    // not stringifiable
  }
  return false;
}

function inferEventType(ev: VowenaEvent): string {
  const firstTopic = ev.topics?.[0];
  if (typeof firstTopic === "string") return firstTopic;
  const maybe = firstTopic as { toString?: () => string };
  if (maybe?.toString) return String(maybe.toString());
  return ev.type || "event";
}

function extractAmount(ev: VowenaEvent): number | undefined {
  const data = ev.data as Record<string, unknown> | unknown;
  if (data && typeof data === "object" && "amount" in data) {
    const amt = (data as { amount: unknown }).amount;
    if (typeof amt === "number") return amt;
    if (typeof amt === "bigint") return Number(amt);
  }
  // Some events emit amount as a numeric value at the data root or in arrays
  if (typeof data === "number") return data;
  if (typeof data === "bigint") return Number(data);
  return undefined;
}

function extractTxHash(ev: VowenaEvent): string | undefined {
  // VowenaEvent doesn't standardize txHash; some RPC responses include it
  // as `txHash` or under `id` (which is `<ledger>-<txIndex>-<eventIndex>`).
  const e = ev as unknown as Record<string, unknown>;
  if (typeof e.txHash === "string") return e.txHash;
  if (typeof e.id === "string") return undefined; // can't derive hash from id alone
  return undefined;
}

"use client";

import { useQuery } from "@tanstack/react-query";
import {
  rpc as SorobanRpc,
  xdr,
  scValToNative,
} from "@stellar/stellar-sdk";
import { CONTRACT } from "@/lib/chain";

export interface SubscriptionEvent {
  type: string;
  timestamp: number;
  ledger: number;
  amount?: number;
  /** Stellar transaction hash, linkable directly to the tx page on Explorer. */
  txHash?: string;
}

const server = new SorobanRpc.Server(CONTRACT.RPC_URL);

/**
 * Walk recent Soroban events on our contract, keep the ones that reference
 * this sub_id, and return them with real tx hashes and timestamps so the UI
 * can link each row to the exact transaction.
 *
 * We bypass the @vowena/sdk wrapper because it strips `txHash` and
 * `ledgerClosedAt` during parsing; those are exactly the two fields the UI
 * needs to make clickable, timestamped charge rows.
 *
 * Soroban RPC retains events for ~24h on testnet. Older charges fall through
 * to the synth fallback in the UI.
 */
export function useSubscriptionEvents(subId: number | null) {
  return useQuery({
    queryKey: ["subscription-events", subId],
    queryFn: async (): Promise<SubscriptionEvent[]> => {
      if (subId == null) return [];

      const latest = await server.getLatestLedger();
      const start = Math.max(1, latest.sequence - 17_280); // ~24h on testnet

      const response = await server.getEvents({
        startLedger: start,
        filters: [
          {
            type: "contract",
            contractIds: [CONTRACT.ID],
          },
        ],
        limit: 1000,
      });

      const matched: SubscriptionEvent[] = [];

      for (const raw of response.events) {
        const decoded = decodeEvent(raw);
        if (!decoded) continue;
        if (!eventReferencesSubId(decoded, subId)) continue;
        matched.push(decoded);
      }

      return matched.sort((a, b) => b.timestamp - a.timestamp);
    },
    enabled: subId != null,
    staleTime: 10_000,
    refetchInterval: 15_000,
  });
}

interface DecodedEvent {
  type: string;
  ledger: number;
  timestamp: number;
  txHash?: string;
  topics: unknown[];
  data: unknown;
}

function decodeEvent(
  raw: SorobanRpc.Api.EventResponse,
): DecodedEvent | null {
  const topics = raw.topic.map((t) => {
    try {
      if (typeof t === "string") {
        return scValToNative(xdr.ScVal.fromXDR(t, "base64"));
      }
      return scValToNative(t as xdr.ScVal);
    } catch {
      return null;
    }
  });

  let data: unknown;
  try {
    if (typeof raw.value === "string") {
      data = scValToNative(xdr.ScVal.fromXDR(raw.value, "base64"));
    } else {
      data = scValToNative(raw.value as xdr.ScVal);
    }
  } catch {
    data = raw.value;
  }

  const typeTopic = topics[0];
  const type = typeof typeTopic === "string" ? typeTopic : "event";

  // `ledgerClosedAt` is an ISO string like "2026-04-21T13:24:00Z".
  const ts = raw.ledgerClosedAt
    ? Math.floor(new Date(raw.ledgerClosedAt).getTime() / 1000)
    : 0;

  // RPC includes the source tx hash on every event payload.
  const rawAny = raw as unknown as Record<string, unknown>;
  const txHash =
    typeof rawAny.txHash === "string" ? (rawAny.txHash as string) : undefined;

  return {
    type,
    ledger: raw.ledger,
    timestamp: ts,
    txHash,
    topics,
    data,
  };
}

/**
 * Our contract puts sub_id in the event DATA for most events (not topics).
 * charge_ok/sub_created emit a tuple [sub_id, ...]; sub_cancel/sub_paused/
 * sub_react emit sub_id as a bare u64; refund emits [sub_id, amount].
 * We check all these shapes.
 */
function eventReferencesSubId(ev: DecodedEvent, subId: number): boolean {
  if (matches(ev.data, subId)) return true;
  for (const t of ev.topics) {
    if (matches(t, subId)) return true;
  }
  return false;
}

function matches(v: unknown, subId: number): boolean {
  if (v == null) return false;
  if (typeof v === "number") return v === subId;
  if (typeof v === "bigint") return Number(v) === subId;
  if (Array.isArray(v)) return v.some((x) => matches(x, subId));
  if (typeof v === "string" && /^\d+$/.test(v)) return Number(v) === subId;
  return false;
}

"use client";

import { useCallback, useEffect, useState } from "react";

export interface VowenaEvent {
  type: string;
  ledger: number;
  timestamp: number;
  contractId: string;
  topics: unknown[];
  data: unknown;
}

export interface EventFilters {
  merchant?: string;
  subscriber?: string;
  planId?: number;
  type?: string;
  limit?: number;
  cursor?: string;
}

interface UseEventsResult {
  events: VowenaEvent[];
  isLoading: boolean;
  latestLedger: number;
}

export function useEvents(filters: EventFilters): UseEventsResult {
  const [events, setEvents] = useState<VowenaEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [latestLedger, setLatestLedger] = useState(0);

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);

    try {
      const params = new URLSearchParams();
      if (filters.merchant) params.set("merchant", filters.merchant);
      if (filters.subscriber) params.set("subscriber", filters.subscriber);
      if (filters.planId !== undefined)
        params.set("plan_id", String(filters.planId));
      if (filters.type) params.set("type", filters.type);
      if (filters.limit !== undefined)
        params.set("limit", String(filters.limit));
      if (filters.cursor) params.set("cursor", filters.cursor);

      const response = await fetch(`/api/events?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch events");
      }

      const data = await response.json();
      setEvents(data.events ?? []);
      setLatestLedger(data.latestLedger ?? 0);
    } catch {
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  }, [
    filters.merchant,
    filters.subscriber,
    filters.planId,
    filters.type,
    filters.limit,
    filters.cursor,
  ]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return { events, isLoading, latestLedger };
}

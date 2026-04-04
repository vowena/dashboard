"use client";

import { useCallback, useEffect, useState } from "react";

export type SubscriptionStatus = "Active" | "Paused" | "Cancelled" | "Expired";

export interface Subscription {
  id: number;
  planId: number;
  subscriber: string;
  status: SubscriptionStatus;
  createdAt: number;
  periodsBilled: number;
  nextBillingTime: number;
  failedAt: number;
  migrationTarget: number;
  cancelledAt: number;
}

export interface SubscriptionWithPlan extends Subscription {
  planName?: string;
  merchantAddress: string;
  amount: bigint;
  period: number;
  token: string;
}

interface UseSubscriptionsResult {
  subscriptions: SubscriptionWithPlan[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useSubscriptions(
  subscriberAddress: string | null,
): UseSubscriptionsResult {
  const [subscriptions, setSubscriptions] = useState<SubscriptionWithPlan[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchSubscriptions = useCallback(async () => {
    if (!subscriberAddress) {
      setSubscriptions([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // TODO: Replace with actual Soroban RPC call to fetch subscriptions
      // const client = new VowenaClient({ contractId, rpcUrl, networkPassphrase });
      // const result = await client.getSubscriptions(subscriberAddress);
      setSubscriptions([]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err
          : new Error("Failed to fetch subscriptions"),
      );
    } finally {
      setIsLoading(false);
    }
  }, [subscriberAddress]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  return {
    subscriptions,
    isLoading,
    error,
    refetch: fetchSubscriptions,
  };
}

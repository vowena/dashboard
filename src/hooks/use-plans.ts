"use client";

import { useCallback, useEffect, useState } from "react";

export interface Plan {
  id: number;
  merchant: string;
  token: string;
  amount: bigint;
  period: number;
  trialPeriods: number;
  maxPeriods: number;
  gracePeriod: number;
  priceCeiling: bigint;
  createdAt: number;
  active: boolean;
}

interface UsePlansResult {
  plans: Plan[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function usePlans(merchantAddress: string | null): UsePlansResult {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchPlans = useCallback(async () => {
    if (!merchantAddress) {
      setPlans([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // TODO: Replace with actual Soroban RPC call to fetch plans
      // const client = new VowenaClient({ contractId, rpcUrl, networkPassphrase });
      // const result = await client.getPlans(merchantAddress);
      setPlans([]);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch plans"));
    } finally {
      setIsLoading(false);
    }
  }, [merchantAddress]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  return { plans, isLoading, error, refetch: fetchPlans };
}

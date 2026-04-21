import { useQuery } from "@tanstack/react-query";
import {
  getSubscriberSubscriptions,
  getSubscription,
  getPlan,
  getProject,
} from "@/lib/chain";

export interface Plan {
  id: number;
  merchant: string;
  token: string;
  amount: number;
  period: number;
  trialPeriods: number;
  maxPeriods: number;
  gracePeriod: number;
  priceCeiling: number;
  createdAt: number;
  active: boolean;
  name: string;
  projectId: number;
}

export interface Subscription {
  id: number;
  planId: number;
  subscriber: string;
  status: "Active" | "Paused" | "Cancelled" | "Expired" | string;
  createdAt: number;
  periodsBilled: number;
  nextBillingTime: number;
  failedAt: number;
  migrationTarget: number;
  cancelledAt: number;
  plan?: Plan;
  /** Plan display name from the on-chain Plan record */
  planName?: string;
  /** Project name fetched from the on-chain Project (via plan.projectId) */
  projectName?: string;
}

/**
 * Fetch all subscriptions for the connected subscriber, augmented with the
 * plan + project names — both pulled directly from the contract. No more
 * Stellar account data lookups; everything is chain-native.
 */
export function useSubscriptions(subscriberAddress: string | null) {
  return useQuery({
    queryKey: ["subscriptions", subscriberAddress],
    queryFn: async () => {
      if (!subscriberAddress) return [];

      const subIds = await getSubscriberSubscriptions(subscriberAddress);

      // Fetch each subscription + its plan in parallel
      const baseSubs = await Promise.all(
        subIds.map(async (subId) => {
          const sub = await getSubscription(subId, subscriberAddress);
          const plan = await getPlan(sub.planId, sub.subscriber);
          return { ...sub, plan } as Subscription;
        }),
      );

      // For each unique plan.projectId, fetch the project from chain.
      const uniqueProjectIds = Array.from(
        new Set(baseSubs.map((s) => s.plan?.projectId).filter(Boolean)),
      ) as number[];

      const projectNames = new Map<number, string>();
      await Promise.all(
        uniqueProjectIds.map(async (pid) => {
          try {
            const proj = await getProject(pid);
            projectNames.set(pid, proj.name);
          } catch {
            // project missing on chain — fine, fallback shows nothing
          }
        }),
      );

      return baseSubs.map((sub) => ({
        ...sub,
        planName: sub.plan?.name,
        projectName: sub.plan
          ? projectNames.get(sub.plan.projectId)
          : undefined,
      }));
    },
    enabled: !!subscriberAddress,
    staleTime: 10000,
    refetchInterval: 30000,
  });
}

export function useSubscription(
  subId: number | null,
  subscriberAddress: string | null,
) {
  return useQuery({
    queryKey: ["subscription", subId, subscriberAddress],
    queryFn: async () => {
      if (!subId || !subscriberAddress) return null;

      const sub = await getSubscription(subId, subscriberAddress);
      const plan = await getPlan(sub.planId, sub.subscriber);

      let projectName: string | undefined;
      try {
        const proj = await getProject(plan.projectId);
        projectName = proj.name;
      } catch {
        // ignore
      }

      return {
        ...sub,
        plan,
        planName: plan.name,
        projectName,
      } as Subscription;
    },
    enabled: !!subId && !!subscriberAddress,
    staleTime: 5000,
    refetchInterval: 30000,
  });
}

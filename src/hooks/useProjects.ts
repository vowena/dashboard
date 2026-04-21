"use client";

import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useWallet } from "@/components/wallet/wallet-provider";
import { client, getMerchantProjects, getProject, READ_CALLER } from "@/lib/chain";
import { createProject as createProjectTx } from "@/lib/contract";
import { getPlan, getMerchantPlans, type ChainPlan } from "@/lib/chain";

export interface Project {
  /** Globally unique chain-assigned u64. The single source of identity. */
  id: number;
  merchant: string;
  name: string;
  description: string;
  createdAt: number;
}

export type NamedPlan = ChainPlan & { name: string };

export type CreateStatus = "preparing" | "signing" | "submitting" | "done";

export function useProjects() {
  const { address } = useWallet();
  const queryClient = useQueryClient();
  const queryKey = ["projects", address];

  const query = useQuery({
    queryKey,
    queryFn: async (): Promise<Project[]> => {
      if (!address) return [];
      const ids = await getMerchantProjects(address);
      const projects = await Promise.all(
        ids.map((id) => getProject(id).catch(() => null)),
      );
      return projects
        .filter((p): p is NonNullable<typeof p> => p !== null)
        .sort((a, b) => a.createdAt - b.createdAt);
    },
    enabled: !!address,
    staleTime: 5_000,
    refetchOnWindowFocus: true,
  });

  /**
   * Create a new Project on chain. The contract assigns the project_id;
   * we identify the new one by diffing the merchant's project list before
   * vs. after the submit.
   */
  const createProject = useCallback(
    async (
      name: string,
      description: string | undefined,
      onStatus?: (s: CreateStatus) => void,
    ): Promise<Project> => {
      if (!address) throw new Error("Wallet not connected");

      onStatus?.("preparing");
      const before = new Set(await getMerchantProjects(address));

      onStatus?.("signing");
      await createProjectTx({
        merchant: address,
        name,
        description,
      });

      onStatus?.("submitting");
      // Discover the new project_id by diff
      const after = await getMerchantProjects(address);
      const fresh = after.filter((id) => !before.has(id));
      const newId =
        fresh.length > 0
          ? Math.max(...fresh)
          : after.length > 0
            ? Math.max(...after)
            : 0;

      const newProject: Project = {
        id: newId,
        merchant: address,
        name,
        description: description ?? "",
        createdAt: Math.floor(Date.now() / 1000),
      };

      // Optimistic update
      queryClient.setQueryData<Project[]>(queryKey, (old = []) =>
        [...old, newProject].sort((a, b) => a.createdAt - b.createdAt),
      );

      // Reconcile shortly after
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey });
      }, 2000);

      onStatus?.("done");
      return newProject;
    },
    [address, queryClient, queryKey],
  );

  return {
    projects: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    createProject,
    refetch: query.refetch,
  };
}

/**
 * Fetch all plans belonging to a specific project (filters merchant plans
 * by plan.projectId, where both project_id and project membership are
 * stored on chain by the contract).
 */
export async function getProjectPlansWithData(
  merchantAddress: string,
  projectId: number,
): Promise<NamedPlan[]> {
  try {
    const allMerchantIds = await getMerchantPlans(merchantAddress);
    if (allMerchantIds.length === 0) return [];

    const plans = await Promise.all(
      allMerchantIds.map((id) =>
        getPlan(id, merchantAddress).catch(() => null),
      ),
    );

    return plans
      .filter((p): p is NonNullable<typeof p> => p !== null)
      .filter((p) => p.projectId === projectId)
      .map((p) => ({ ...p }));
  } catch (error) {
    console.error("Failed to fetch project plans:", error);
    return [];
  }
}

// Re-export so existing imports keep working without changes
void client;
void READ_CALLER;

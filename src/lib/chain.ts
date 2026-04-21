import {
  VowenaClient,
  fromStroops,
  SECONDS_PER_DAY,
  type Plan as SdkPlan,
  type Project as SdkProject,
  type Subscription as SdkSubscription,
} from "@vowena/sdk";

const CONTRACT_ID = "CCNDNEGYFYKTVBM7T2BEF5YVSKKICE44JOVHT7SAN5YTKHHBFIIEL72T";
const RPC_URL = "https://soroban-testnet.stellar.org";
const PASSPHRASE = "Test SDF Network ; September 2015";

export const client = new VowenaClient({
  contractId: CONTRACT_ID,
  rpcUrl: RPC_URL,
  networkPassphrase: PASSPHRASE,
});

export { SECONDS_PER_DAY, fromStroops };
export const CONTRACT = { ID: CONTRACT_ID, RPC_URL, PASSPHRASE };

/**
 * A known-funded testnet account used as the caller/source for read-only
 * Soroban simulations. The caller arg only matters because Soroban needs
 * *some* funded account as the simulation source — using a stable known
 * one means fresh/unfunded wallets can still browse plans and read state.
 */
export const READ_CALLER =
  "GAGRLI6F336OEJF627UNHBOPXI6VDQ75DRMSWSX2FQ25F3RFVWJOIIQU";

export interface ChainPlan {
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
  /** Display name set on chain by the merchant */
  name: string;
  /** Chain-assigned ID of the parent project this plan belongs to */
  projectId: number;
}

export interface ChainProject {
  id: number;
  merchant: string;
  name: string;
  description: string;
  createdAt: number;
}

export interface ChainSubscription {
  id: number;
  planId: number;
  subscriber: string;
  status: string;
  createdAt: number;
  periodsBilled: number;
  nextBillingTime: number;
  failedAt: number;
  migrationTarget: number;
  cancelledAt: number;
}

function normalizePlan(plan: SdkPlan): ChainPlan {
  return {
    id: Number(plan.id),
    merchant: String(plan.merchant),
    token: String(plan.token),
    amount: Number(plan.amount),
    period: Number(plan.period),
    trialPeriods: Number(plan.trialPeriods),
    maxPeriods: Number(plan.maxPeriods),
    gracePeriod: Number(plan.gracePeriod),
    priceCeiling: Number(plan.priceCeiling),
    createdAt: Number(plan.createdAt),
    active: Boolean(plan.active),
    name: plan.name ?? "",
    projectId: Number(plan.projectId ?? 0),
  };
}

function normalizeProject(p: SdkProject): ChainProject {
  return {
    id: Number(p.id),
    merchant: String(p.merchant),
    name: p.name ?? "",
    description: p.description ?? "",
    createdAt: Number(p.createdAt),
  };
}

export async function getProject(projectId: number): Promise<ChainProject> {
  const p = await client.getProject(projectId, READ_CALLER);
  return normalizeProject(p);
}

export async function getMerchantProjects(
  merchantAddress: string,
): Promise<number[]> {
  try {
    const ids = await client.getMerchantProjects(merchantAddress, READ_CALLER);
    return ids.map((id) => Number(id));
  } catch (error) {
    console.error("getMerchantProjects failed:", error);
    return [];
  }
}

function normalizeSub(sub: SdkSubscription): ChainSubscription {
  return {
    id: Number(sub.id),
    planId: Number(sub.planId),
    subscriber: String(sub.subscriber),
    status: String(sub.status),
    createdAt: Number(sub.createdAt),
    periodsBilled: Number(sub.periodsBilled),
    nextBillingTime: Number(sub.nextBillingTime),
    failedAt: Number(sub.failedAt),
    migrationTarget: Number(sub.migrationTarget),
    cancelledAt: Number(sub.cancelledAt),
  };
}

export async function getSubscriberSubscriptions(
  address: string,
): Promise<number[]> {
  try {
    // Use READ_CALLER as the simulation source so even unfunded fresh
    // wallets can query their (empty) subscription list without errors.
    const subIds = await client.getSubscriberSubscriptions(address, READ_CALLER);
    return subIds.map((id) => Number(id));
  } catch (error) {
    console.error("getSubscriberSubscriptions failed:", error);
    return [];
  }
}

export async function getSubscription(
  subId: number,
  _subscriberAddress: string,
): Promise<ChainSubscription> {
  const sub = await client.getSubscription(subId, READ_CALLER);
  return normalizeSub(sub);
}

export async function getPlan(
  planId: number,
  _merchantAddress: string,
): Promise<ChainPlan> {
  const plan = await client.getPlan(planId, READ_CALLER);
  return normalizePlan(plan);
}

export async function getMerchantPlans(
  merchantAddress: string,
): Promise<number[]> {
  try {
    const planIds = await client.getMerchantPlans(merchantAddress, READ_CALLER);
    return planIds.map((id) => Number(id));
  } catch (error) {
    console.error("getMerchantPlans failed:", error);
    return [];
  }
}

export async function getPlanSubscribers(
  planId: number,
  _callerAddress: string,
): Promise<number[]> {
  try {
    const subIds = await client.getPlanSubscribers(planId, READ_CALLER);
    return subIds.map((id) => Number(id));
  } catch (error) {
    console.error("getPlanSubscribers failed:", error);
    return [];
  }
}

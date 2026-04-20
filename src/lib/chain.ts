import {
  VowenaClient,
  fromStroops,
  SECONDS_PER_DAY,
  type Plan as SdkPlan,
  type Subscription as SdkSubscription,
} from "@vowena/sdk";

const CONTRACT_ID = "CBENQGQPLC3CKU5HCRZPBIT6RSZVLUJKUCVPJFJGYJ3OXEW7BZCXULC2";
const RPC_URL = "https://soroban-testnet.stellar.org";
const PASSPHRASE = "Test SDF Network ; September 2015";

export const client = new VowenaClient({
  contractId: CONTRACT_ID,
  rpcUrl: RPC_URL,
  networkPassphrase: PASSPHRASE,
});

export { SECONDS_PER_DAY, fromStroops };
export const CONTRACT = { ID: CONTRACT_ID, RPC_URL, PASSPHRASE };

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
  };
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
    const subIds = await client.getSubscriberSubscriptions(address, address);
    return subIds.map((id) => Number(id));
  } catch (error) {
    console.error("getSubscriberSubscriptions failed:", error);
    return [];
  }
}

export async function getSubscription(
  subId: number,
  subscriberAddress: string,
): Promise<ChainSubscription> {
  const sub = await client.getSubscription(subId, subscriberAddress);
  return normalizeSub(sub);
}

export async function getPlan(
  planId: number,
  merchantAddress: string,
): Promise<ChainPlan> {
  const plan = await client.getPlan(planId, merchantAddress);
  return normalizePlan(plan);
}

export async function getMerchantPlans(
  merchantAddress: string,
): Promise<number[]> {
  try {
    const planIds = await client.getMerchantPlans(
      merchantAddress,
      merchantAddress,
    );
    return planIds.map((id) => Number(id));
  } catch (error) {
    console.error("getMerchantPlans failed:", error);
    return [];
  }
}

export async function getPlanSubscribers(
  planId: number,
  callerAddress: string,
): Promise<number[]> {
  try {
    const subIds = await client.getPlanSubscribers(planId, callerAddress);
    return subIds.map((id) => Number(id));
  } catch (error) {
    console.error("getPlanSubscribers failed:", error);
    return [];
  }
}

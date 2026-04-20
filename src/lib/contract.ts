"use client";

import { rpc as SorobanRpc } from "@stellar/stellar-sdk";
import { StellarWalletsKit } from "@creit.tech/stellar-wallets-kit/sdk";
import { client, CONTRACT } from "@/lib/chain";

const server = new SorobanRpc.Server(CONTRACT.RPC_URL);

async function signAndSubmit(params: {
  xdr: string;
  sourceAddress: string;
}) {
  const { signedTxXdr } = await StellarWalletsKit.signTransaction(params.xdr, {
    networkPassphrase: CONTRACT.PASSPHRASE,
    address: params.sourceAddress,
  });
  return client.submitTransaction(signedTxXdr);
}

// ============== High-level write operations ==============

export async function createPlan(params: {
  merchant: string;
  token: string;
  amountUsdc: number;
  period: number;
  trialPeriods?: number;
  maxPeriods?: number;
  gracePeriod?: number;
  priceCeilingUsdc: number;
}) {
  const built = await client.buildCreatePlan({
    merchant: params.merchant,
    token: params.token,
    amount: BigInt(Math.floor(params.amountUsdc * 1e7)),
    period: params.period,
    trialPeriods: params.trialPeriods ?? 0,
    maxPeriods: params.maxPeriods ?? 0,
    gracePeriod: params.gracePeriod ?? 86400,
    priceCeiling: BigInt(Math.floor(params.priceCeilingUsdc * 1e7)),
  });

  return signAndSubmit({ xdr: built, sourceAddress: params.merchant });
}

export async function subscribeToPlan(params: {
  subscriber: string;
  planId: number;
  expirationLedger?: number;
  allowancePeriods?: number;
}) {
  const built = await client.buildSubscribe(params.subscriber, params.planId, {
    expirationLedger: params.expirationLedger,
    allowancePeriods: params.allowancePeriods,
  });

  return signAndSubmit({ xdr: built, sourceAddress: params.subscriber });
}

export async function cancelSubscription(params: {
  caller: string;
  subId: number;
}) {
  const built = await client.buildCancel(params.caller, params.subId);
  return signAndSubmit({ xdr: built, sourceAddress: params.caller });
}

export async function refundSubscriber(params: {
  merchant: string;
  subId: number;
  amountUsdc: number;
}) {
  const built = await client.buildRefund(
    params.merchant,
    params.subId,
    BigInt(Math.floor(params.amountUsdc * 1e7)),
  );
  return signAndSubmit({ xdr: built, sourceAddress: params.merchant });
}

export async function updatePlanAmount(params: {
  merchant: string;
  planId: number;
  newAmountUsdc: number;
}) {
  const built = await client.buildUpdatePlanAmount(
    params.merchant,
    params.planId,
    BigInt(Math.floor(params.newAmountUsdc * 1e7)),
  );
  return signAndSubmit({ xdr: built, sourceAddress: params.merchant });
}

export async function getLatestLedger() {
  const latest = await server.getLatestLedger();
  return latest.sequence;
}

import { type NextRequest, NextResponse } from "next/server";
import {
  Keypair,
  TransactionBuilder,
  Networks,
  rpc as SorobanRpc,
  Contract,
  nativeToScVal,
  scValToNative,
} from "@stellar/stellar-sdk";

/**
 * Vercel cron entry point. Configured to fire every 5 minutes via
 * vercel.json. Walks plan subscribers and fires charge() on every
 * subscription. The contract itself decides what's actually due — calling
 * for a not-yet-due sub is a harmless no-op (returns false, no debit).
 *
 * Auth: when CRON_SECRET is set, require Authorization: Bearer <secret>.
 * Vercel automatically sends this header for scheduled cron invocations.
 *
 * Required env: VOWENA_ISSUER_SECRET — funded testnet account that signs
 * the charge() txs. charge() is permissionless on the contract so any
 * funded account works; we re-use the issuer key already configured.
 */

const CONTRACT_ID = "CCNDNEGYFYKTVBM7T2BEF5YVSKKICE44JOVHT7SAN5YTKHHBFIIEL72T";
const RPC_URL = "https://soroban-testnet.stellar.org";

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const issuerSecret = process.env.VOWENA_ISSUER_SECRET;
  if (!issuerSecret) {
    return NextResponse.json(
      { error: "VOWENA_ISSUER_SECRET not configured" },
      { status: 503 },
    );
  }

  const keeper = Keypair.fromSecret(issuerSecret);
  const server = new SorobanRpc.Server(RPC_URL);
  const contract = new Contract(CONTRACT_ID);

  try {
    // Walk plan IDs, collecting all subscribers. The contract has no
    // global subscriber index so we iterate plan IDs from 1 until we hit
    // 5 consecutive misses (post-deletion gap detection).
    const allSubIds = new Set<number>();
    let planId = 1;
    let consecutiveMisses = 0;

    while (consecutiveMisses < 5 && planId < 10_000) {
      try {
        const subs = await readVecU64(
          server,
          keeper.publicKey(),
          contract,
          "get_plan_subscribers",
          [nativeToScVal(planId, { type: "u64" })],
        );
        for (const sid of subs) allSubIds.add(sid);
        consecutiveMisses = 0;
      } catch {
        consecutiveMisses++;
      }
      planId++;
    }

    if (allSubIds.size === 0) {
      return NextResponse.json({
        ranAt: new Date().toISOString(),
        attempted: 0,
        charged: 0,
        failed: 0,
      });
    }

    let charged = 0;
    let failed = 0;
    for (const subId of Array.from(allSubIds)) {
      try {
        const account = await server.getAccount(keeper.publicKey());
        const tx = new TransactionBuilder(account, {
          fee: "100000",
          networkPassphrase: Networks.TESTNET,
        })
          .addOperation(
            contract.call("charge", nativeToScVal(subId, { type: "u64" })),
          )
          .setTimeout(30)
          .build();

        const sim = await server.simulateTransaction(tx);
        if (SorobanRpc.Api.isSimulationError(sim)) {
          failed++;
          continue;
        }
        const prepared = SorobanRpc.assembleTransaction(tx, sim).build();
        prepared.sign(keeper);
        const sent = await server.sendTransaction(prepared);
        if (sent.status === "ERROR") {
          failed++;
          continue;
        }

        let result = await server.getTransaction(sent.hash);
        const deadline = Date.now() + 12_000;
        while (result.status === "NOT_FOUND" && Date.now() < deadline) {
          await new Promise((r) => setTimeout(r, 1000));
          result = await server.getTransaction(sent.hash);
        }
        if (result.status === "SUCCESS") {
          const rv = result.returnValue;
          const wasCharged = rv != null ? Boolean(scValToNative(rv)) : false;
          if (wasCharged) charged++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
    }

    return NextResponse.json({
      ranAt: new Date().toISOString(),
      attempted: allSubIds.size,
      charged,
      failed,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Cron failed" },
      { status: 500 },
    );
  }
}

async function readVecU64(
  server: SorobanRpc.Server,
  caller: string,
  contract: Contract,
  fn: string,
  args: ReturnType<typeof nativeToScVal>[],
): Promise<number[]> {
  const account = await server.getAccount(caller);
  const tx = new TransactionBuilder(account, {
    fee: "100",
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(contract.call(fn, ...args))
    .setTimeout(30)
    .build();
  const sim = await server.simulateTransaction(tx);
  if (SorobanRpc.Api.isSimulationError(sim) || !("result" in sim)) return [];
  const rv = sim.result?.retval;
  if (!rv) return [];
  try {
    const native = scValToNative(rv) as unknown[];
    return native.map((x) => Number(x));
  } catch {
    return [];
  }
}

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
 * Vercel cron entry point. Walks plan subscribers and fires charge() on
 * every subscription. Contract decides what's actually due.
 *
 * Critical perf design:
 *   1. Discovery (get_plan_subscribers per plan) runs in PARALLEL — these
 *      are read-only simulations, no sequence concerns.
 *   2. Charge submissions run SERIALLY. Stellar requires sequence numbers
 *      to be the *exact* next one (account.seq + 1); parallel submissions
 *      from the same source account get rejected as tx_bad_seq except the
 *      first to land. We re-fetch the account between each submit so the
 *      sequence is always up-to-date.
 *   3. We do NOT poll for inclusion — that was burning ~12s per sub. We
 *      just send and move on. charge() is idempotent within a period.
 *
 * Auth: when CRON_SECRET is set, require Authorization: Bearer <secret>.
 * Required env: VOWENA_ISSUER_SECRET (signs charge() — permissionless on contract).
 */

export const maxDuration = 300;

const CONTRACT_ID = "CCNDNEGYFYKTVBM7T2BEF5YVSKKICE44JOVHT7SAN5YTKHHBFIIEL72T";
const RPC_URL = "https://soroban-testnet.stellar.org";
const MAX_PLAN_SCAN = 200;

interface ChargeResult {
  subId: number;
  hash?: string;
  error?: string;
}

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
    // 1) Parallel plan-subscriber discovery (reads only)
    const planIds = Array.from({ length: MAX_PLAN_SCAN }, (_, i) => i + 1);
    const subscribersPerPlan = await Promise.all(
      planIds.map((pid) =>
        readVecU64(server, keeper.publicKey(), contract, "get_plan_subscribers", [
          nativeToScVal(pid, { type: "u64" }),
        ]).catch(() => [] as number[]),
      ),
    );
    const subIds = Array.from(new Set(subscribersPerPlan.flat()));

    if (subIds.length === 0) {
      return NextResponse.json({
        ranAt: new Date().toISOString(),
        attempted: 0,
        submitted: 0,
        failed: 0,
        results: [],
      });
    }

    // 2) Serial charge submissions (sequence-correct)
    const results: ChargeResult[] = [];
    for (const subId of subIds) {
      results.push(await chargeOne(server, keeper, contract, subId));
    }

    const submitted = results.filter((r) => !r.error).length;
    const failed = results.length - submitted;

    return NextResponse.json({
      ranAt: new Date().toISOString(),
      attempted: subIds.length,
      submitted,
      failed,
      results,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Cron failed" },
      { status: 500 },
    );
  }
}

async function chargeOne(
  server: SorobanRpc.Server,
  keeper: Keypair,
  contract: Contract,
  subId: number,
): Promise<ChargeResult> {
  try {
    // Fetch fresh account so we always have the next-expected sequence.
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
      return { subId, error: `sim: ${sim.error}` };
    }

    const prepared = SorobanRpc.assembleTransaction(tx, sim).build();
    prepared.sign(keeper);
    const sent = await server.sendTransaction(prepared);
    if (sent.status === "ERROR") {
      const code = (sent as { errorResult?: { result?: () => { switch?: () => { name?: string } } } })?.errorResult?.result?.()?.switch?.()?.name;
      return { subId, error: `send: ${code ?? "error"}` };
    }
    return { subId, hash: sent.hash };
  } catch (err) {
    return {
      subId,
      error: err instanceof Error ? err.message : "unknown error",
    };
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

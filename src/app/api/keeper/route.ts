import { type NextRequest, NextResponse } from "next/server";
import {
  Keypair,
  TransactionBuilder,
  Networks,
  rpc as SorobanRpc,
  Contract,
  nativeToScVal,
  scValToNative,
  StrKey,
} from "@stellar/stellar-sdk";

/**
 * Manual keeper trigger ('Run now' button). Same logic as the scheduled
 * /api/cron, scoped to a single merchant.
 *
 * Submissions are SERIAL (Stellar requires monotonic sequence per source);
 * discovery is parallel. We don't poll for inclusion.
 */

export const maxDuration = 300;

const CONTRACT_ID = "CCNDNEGYFYKTVBM7T2BEF5YVSKKICE44JOVHT7SAN5YTKHHBFIIEL72T";
const RPC_URL = "https://soroban-testnet.stellar.org";

interface ChargeResult {
  subId: number;
  hash?: string;
  error?: string;
}

export async function POST(request: NextRequest) {
  let body: { merchantAddress?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const merchantAddress = body?.merchantAddress;
  if (!merchantAddress || !StrKey.isValidEd25519PublicKey(merchantAddress)) {
    return NextResponse.json(
      { error: "merchantAddress required" },
      { status: 400 },
    );
  }

  const secret = process.env.VOWENA_ISSUER_SECRET;
  if (!secret) {
    return NextResponse.json(
      {
        error: "Keeper not configured. Set VOWENA_ISSUER_SECRET in env.",
      },
      { status: 503 },
    );
  }

  const keeper = Keypair.fromSecret(secret);
  const server = new SorobanRpc.Server(RPC_URL);
  const contract = new Contract(CONTRACT_ID);

  try {
    const merchantPlanIds = await readVecU64(
      server,
      keeper.publicKey(),
      contract,
      "get_merchant_plans",
      [nativeToScVal(merchantAddress, { type: "address" })],
    );
    if (merchantPlanIds.length === 0) {
      return NextResponse.json({
        attempted: 0,
        submitted: 0,
        charged: 0,
        failed: 0,
        results: [],
      });
    }

    const subscribersPerPlan = await Promise.all(
      merchantPlanIds.map((pid) =>
        readVecU64(server, keeper.publicKey(), contract, "get_plan_subscribers", [
          nativeToScVal(pid, { type: "u64" }),
        ]).catch(() => [] as number[]),
      ),
    );
    const subIds = Array.from(new Set(subscribersPerPlan.flat()));

    if (subIds.length === 0) {
      return NextResponse.json({
        attempted: 0,
        submitted: 0,
        charged: 0,
        failed: 0,
        results: [],
      });
    }

    // Serial submission to keep sequence numbers monotonic
    const results: ChargeResult[] = [];
    for (const subId of subIds) {
      results.push(await chargeOne(server, keeper, contract, subId));
    }

    const submitted = results.filter((r) => !r.error).length;
    const failed = results.length - submitted;

    return NextResponse.json({
      attempted: subIds.length,
      submitted,
      charged: submitted,
      failed,
      results,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Keeper run failed" },
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
      return { subId, error: "send error" };
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

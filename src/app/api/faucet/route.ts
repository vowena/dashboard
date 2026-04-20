import {
  Asset,
  Keypair,
  Networks,
  Operation,
  TransactionBuilder,
  Horizon,
  StrKey,
} from "@stellar/stellar-sdk";

/**
 * Testnet USDC faucet.
 *
 * Sends 1000 TUSDC from the issuer wallet to the requester. Requires the
 * issuer's secret to be configured server-side (never exposed to the client):
 *
 *   VOWENA_ISSUER_SECRET=S...   (the SAC issuer's secret seed)
 *
 * The destination must already have a trustline established for TUSDC. The
 * checkout page guides users through that step before showing the faucet.
 *
 * This endpoint exists only because there's no public TUSDC faucet. On
 * mainnet (real USDC), users acquire it through normal channels and this
 * endpoint is not used.
 */

const ISSUER_PUBLIC = "GBAINHPXCOOQMUYL5AEOMLIXDDQJOMYPIO4KZXXSUSHMZWQVIQA4CFQV";
const ASSET_CODE = "TUSDC";
const HORIZON_URL = "https://horizon-testnet.stellar.org";
const FAUCET_AMOUNT = "1000"; // 1000 TUSDC per request

export async function POST(req: Request) {
  let body: { address?: string };
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const address = body?.address;
  if (!address || typeof address !== "string") {
    return jsonError("address required", 400);
  }
  if (!StrKey.isValidEd25519PublicKey(address)) {
    return jsonError("invalid Stellar address", 400);
  }

  const secret = process.env.VOWENA_ISSUER_SECRET;
  if (!secret) {
    return jsonError(
      "Faucet not configured. Set VOWENA_ISSUER_SECRET in the dashboard env to enable.",
      503,
    );
  }

  let issuer: Keypair;
  try {
    issuer = Keypair.fromSecret(secret);
  } catch {
    return jsonError("Faucet misconfigured (invalid secret)", 500);
  }

  if (issuer.publicKey() !== ISSUER_PUBLIC) {
    return jsonError(
      "Faucet misconfigured (secret doesn't match expected issuer)",
      500,
    );
  }

  const horizon = new Horizon.Server(HORIZON_URL);

  try {
    // Make sure the destination has a trustline; if not, we can't pay them
    let dest;
    try {
      dest = await horizon.loadAccount(address);
    } catch {
      return jsonError(
        "Destination account not found on testnet. Fund it with XLM via friendbot first.",
        400,
      );
    }
    const hasTrustline = (dest.balances || []).some(
      (b) =>
        "asset_code" in b &&
        b.asset_code === ASSET_CODE &&
        "asset_issuer" in b &&
        b.asset_issuer === ISSUER_PUBLIC,
    );
    if (!hasTrustline) {
      return jsonError(
        "No TUSDC trustline. Establish a trustline first.",
        400,
      );
    }

    const account = await horizon.loadAccount(issuer.publicKey());
    const tx = new TransactionBuilder(account, {
      fee: "100",
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(
        Operation.payment({
          destination: address,
          asset: new Asset(ASSET_CODE, ISSUER_PUBLIC),
          amount: FAUCET_AMOUNT,
        }),
      )
      .setTimeout(30)
      .build();

    tx.sign(issuer);
    const result = await horizon.submitTransaction(tx);
    return Response.json({
      hash: result.hash,
      amount: FAUCET_AMOUNT,
      asset: ASSET_CODE,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Faucet request failed";
    return jsonError(msg, 500);
  }
}

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

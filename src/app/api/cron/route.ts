import { type NextRequest, NextResponse } from "next/server";

interface KeeperConfig {
  contractId: string;
  rpcUrl: string;
  merchantAddress: string;
}

// TODO: Load from database or environment
const keeperConfigs: KeeperConfig[] = [];

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: Array<{
    merchant: string;
    charged: number;
    failed: number;
  }> = [];

  for (const config of keeperConfigs) {
    // TODO: Wire up to KeeperService.chargeDue()
    // const keeper = new KeeperService();
    // const result = await keeper.chargeDue(
    //   config.contractId,
    //   config.rpcUrl,
    //   signerSecret,
    // );

    results.push({
      merchant: config.merchantAddress,
      charged: 0,
      failed: 0,
    });
  }

  const totalCharged = results.reduce((sum, r) => sum + r.charged, 0);
  const totalFailed = results.reduce((sum, r) => sum + r.failed, 0);

  return NextResponse.json({
    summary: {
      merchants: results.length,
      totalCharged,
      totalFailed,
    },
    results,
  });
}

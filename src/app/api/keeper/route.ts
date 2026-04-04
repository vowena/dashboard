import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { merchantAddress } = body as { merchantAddress?: string };

    if (!merchantAddress) {
      return NextResponse.json(
        { error: "merchantAddress is required" },
        { status: 400 },
      );
    }

    // TODO: Wire up to KeeperService.chargeDue()
    // const keeper = new KeeperService();
    // const result = await keeper.chargeDue(contractId, rpcUrl, signerSecret);

    return NextResponse.json({
      charged: 0,
      failed: 0,
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }
}

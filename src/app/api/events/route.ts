import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const _merchant = searchParams.get("merchant");
  const _subscriber = searchParams.get("subscriber");
  const _planId = searchParams.get("plan_id");
  const _type = searchParams.get("type");
  const _limit = searchParams.get("limit");
  const _cursor = searchParams.get("cursor");

  // TODO: Wire up to EventIndexer.getEvents() with filters
  // const indexer = getIndexerInstance();
  // const events = indexer.getEvents({
  //   merchant, subscriber, planId, type, limit, cursor,
  // });

  return NextResponse.json({
    events: [],
    latestLedger: 0,
  });
}

import { NextResponse } from "next/server";

// TODO: Wire up to EventIndexer.getEvents() with filters from searchParams
// (merchant, subscriber, plan_id, type, limit, cursor)
export async function GET() {

  return NextResponse.json({
    events: [],
    latestLedger: 0,
  });
}

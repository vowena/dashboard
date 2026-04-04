import { type NextRequest, NextResponse } from "next/server";

interface PlanMetadata {
  planId: number;
  name: string;
  description: string;
  merchantName: string;
  logoUrl: string;
}

// In-memory store. Replace with database in production.
const metadataStore = new Map<number, PlanMetadata>();

export async function GET(request: NextRequest) {
  const planIdParam = request.nextUrl.searchParams.get("plan_id");

  if (!planIdParam) {
    return NextResponse.json(
      { error: "plan_id query parameter is required" },
      { status: 400 },
    );
  }

  const planId = Number(planIdParam);
  if (Number.isNaN(planId)) {
    return NextResponse.json(
      { error: "plan_id must be a number" },
      { status: 400 },
    );
  }

  const metadata = metadataStore.get(planId);
  if (!metadata) {
    return NextResponse.json(
      { error: "Metadata not found" },
      { status: 404 },
    );
  }

  return NextResponse.json(metadata);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { planId, name, description, merchantName, logoUrl } = body as {
      planId?: number;
      name?: string;
      description?: string;
      merchantName?: string;
      logoUrl?: string;
    };

    if (planId === undefined || !name) {
      return NextResponse.json(
        { error: "planId and name are required" },
        { status: 400 },
      );
    }

    const metadata: PlanMetadata = {
      planId,
      name,
      description: description ?? "",
      merchantName: merchantName ?? "",
      logoUrl: logoUrl ?? "",
    };

    metadataStore.set(planId, metadata);

    return NextResponse.json(metadata, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }
}

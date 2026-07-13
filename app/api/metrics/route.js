import { NextResponse } from "next/server";
import { getRecentMetrics } from "@/lib/metrics";

export const dynamic = "force-dynamic";

export async function GET() {
  const metrics = await getRecentMetrics();
  return NextResponse.json(metrics);
}

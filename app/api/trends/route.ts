import { NextResponse } from "next/server";
import { fetchTrends } from "@/lib/trends";

export async function GET() {
  try {
    const trends = await fetchTrends();
    return NextResponse.json(trends);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

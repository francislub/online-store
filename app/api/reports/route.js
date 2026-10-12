// Route: /api/reports
// File: src/app/api/reports/route.js
// Usage: GET /api/reports?from=2026-10-01&to=2026-10-12 (defaults to this month)
import { NextResponse } from "next/server";
import { buildReport } from "@/lib/reports";
import { isDay, presetRange } from "@/lib/dates";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const params = request.nextUrl.searchParams;
    const defaults = presetRange("month");
    const from = isDay(params.get("from")) ? params.get("from") : defaults.from;
    const to = isDay(params.get("to")) ? params.get("to") : defaults.to;

    if (from > to) {
      return NextResponse.json({ message: "The start date must be before the end date" }, { status: 400 });
    }

    const report = await buildReport(from, to);
    return NextResponse.json(report);
  } catch (error) {
    console.log(error);
    return NextResponse.json({ message: error.message || "Failed to build report" }, { status: 500 });
  }
}
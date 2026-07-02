/**
 * TEST: API Route — Should be COMPLETELY excluded from scanning
 *
 * No strings in this file should appear in the migration plan.
 */
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    message: "Hello from the API",
    status: "ok",
    description: "This string should never be scanned",
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  return NextResponse.json({
    received: true,
    message: "Data received successfully",
    error: "Invalid request format",
  });
}

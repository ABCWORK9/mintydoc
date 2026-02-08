import { NextResponse } from "next/server";
import { canPostNews } from "@/lib/newsAllowlist";

export function GET(request: Request) {
  const address = new URL(request.url).searchParams.get("address");
  const allowed = canPostNews(address);
  return NextResponse.json({ allowed });
}

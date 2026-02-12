import { NextResponse } from "next/server";
import { getPriceQuote } from "@/server/pricing/policy";

type EstimateBody = {
  sizeBytes: number;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as EstimateBody;
    if (!body?.sizeBytes) {
      return NextResponse.json({ error: "Missing sizeBytes" }, { status: 400 });
    }

    const quote = await getPriceQuote({ sizeBytes: body.sizeBytes });

    return NextResponse.json({
      priceCents: quote.priceCents,
      breakdown: quote.breakdown,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Estimate failed" },
      { status: 500 }
    );
  }
}

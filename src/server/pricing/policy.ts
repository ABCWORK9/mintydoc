import { PRICING } from "@/lib/pricing";
import type { PriceQuote, PricingContext } from "./types";

async function getArweavePriceWinston(sizeBytes: number) {
  const base = process.env.ARWEAVE_PRICE_URL ?? "https://arweave.net/price";
  const res = await fetch(`${base}/${sizeBytes}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch Arweave price");
  const text = await res.text();
  return BigInt(text);
}

let cachedArUsd: { value: number; ts: number } | null = null;

async function getArUsd() {
  const now = Date.now();
  if (cachedArUsd && now - cachedArUsd.ts < 30 * 60 * 1000) {
    return cachedArUsd.value;
  }
  const url =
    process.env.AR_USD_PRICE_URL ??
    "https://api.coingecko.com/api/v3/simple/price?ids=arweave&vs_currencies=usd";
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch AR price");
    const data = await res.json();
    const usd = data?.arweave?.usd;
    if (!usd || typeof usd !== "number") {
      throw new Error("Invalid AR price");
    }
    cachedArUsd = { value: usd, ts: now };
    return usd as number;
  } catch (err) {
    const fallback = process.env.AR_USD_FALLBACK;
    if (fallback) {
      const parsed = Number(fallback);
      if (!Number.isNaN(parsed) && parsed > 0) {
        cachedArUsd = { value: parsed, ts: now };
        return parsed;
      }
    }
    throw err;
  }
}

function toCents(usd: number) {
  return Math.ceil(usd * 100);
}

export async function getPriceQuote(
  ctx: PricingContext
): Promise<PriceQuote> {
  const winston = await getArweavePriceWinston(ctx.sizeBytes);
  const arUsd = await getArUsd();
  const arCost = Number(winston) / 1e12;
  const arweaveUsd = arCost * arUsd;
  const arweaveCents = toCents(arweaveUsd);

  const rawCents = PRICING.baseFeeCents + arweaveCents;
  const markupCents = rawCents * (PRICING.markupMultiplier - 1);
  const totalCents = rawCents * PRICING.markupMultiplier;

  return {
    priceCents: totalCents,
    breakdown: {
      arweaveCents,
      baseFeeCents: PRICING.baseFeeCents,
      markupCents,
      totalCents,
    },
    priceSource: "current_policy_v1",
  };
}

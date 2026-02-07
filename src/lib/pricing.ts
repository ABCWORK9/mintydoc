export const PRICING = {
  baseFeeCents: 1,
  markupMultiplier: 3, // 200% markup => total = raw * 3
};

export function sizeBytesToMb(sizeBytes: number) {
  return Math.ceil(sizeBytes / 1_000_000);
}

export function centsToUsdcUnits(cents: number) {
  return BigInt(cents) * 10_000n; // 1 cent = 0.01 USDC (6 decimals)
}

export function getPricingBreakdown(params: {
  sizeBytes: number;
  arweaveCents: number;
}) {
  const sizeMb = sizeBytesToMb(params.sizeBytes);
  const baseFeeCents = PRICING.baseFeeCents;
  const rawCents = baseFeeCents + params.arweaveCents;
  const markupCents = rawCents * (PRICING.markupMultiplier - 1);
  const totalCents = rawCents * PRICING.markupMultiplier;
  return {
    sizeMb,
    baseFeeCents,
    arweaveCents: params.arweaveCents,
    rawCents,
    markupCents,
    totalCents,
  };
}

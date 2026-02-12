export type PricingContext = {
  sizeBytes: number;
};

export type PriceBreakdown = {
  arweaveCents: number;
  baseFeeCents: number;
  markupCents: number;
  totalCents: number;
};

export type PriceQuote = {
  priceCents: number;
  breakdown: PriceBreakdown;
  priceSource: "current_policy_v1";
};

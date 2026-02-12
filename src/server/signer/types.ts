export type ReserveDigestParams = {
  contractAddress: `0x${string}`;
  payer: `0x${string}`;
  sizeBytes: bigint;
  priceCents: number;
  expiresAt: number;
  nonce: bigint;
};

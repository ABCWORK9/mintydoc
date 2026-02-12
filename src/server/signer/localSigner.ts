import { keccak256, encodePacked } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import type { ReserveDigestParams } from "./types";

export async function signReserveDigest(
  params: ReserveDigestParams
): Promise<`0x${string}`> {
  const signerKey = process.env.DOC_PAY_GO_SIGNER_PRIVATE_KEY;
  if (!signerKey) {
    throw new Error("signer_not_configured");
  }
  const digest = keccak256(
    encodePacked(
      ["address", "address", "uint64", "uint32", "uint40", "uint256"],
      [
        params.contractAddress,
        params.payer,
        params.sizeBytes,
        BigInt(params.priceCents),
        BigInt(params.expiresAt),
        params.nonce,
      ]
    )
  );
  const account = privateKeyToAccount(signerKey as `0x${string}`);
  return account.signMessage({ message: { raw: digest } });
}

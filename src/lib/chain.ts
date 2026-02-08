export type ActiveChain = "amoy" | "polygon";

export function getActiveChain(): ActiveChain {
  const raw = (process.env.NEXT_PUBLIC_CHAIN || "").trim().toLowerCase();
  if (raw === "polygon" || raw === "mainnet") return "polygon";
  return "amoy";
}

export function getExplorerBaseUrl(
  chain: ActiveChain = getActiveChain()
): string {
  switch (chain) {
    case "polygon":
      return "https://polygonscan.com";
    case "amoy":
    default:
      return "https://amoy.polygonscan.com";
  }
}

export function getExplorerTxUrl(
  txHash: string,
  chain: ActiveChain = getActiveChain()
): string {
  return `${getExplorerBaseUrl(chain)}/tx/${txHash}`;
}

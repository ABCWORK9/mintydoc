import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { polygon, polygonAmoy } from "wagmi/chains";

const rawProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "";
const projectId = rawProjectId || "00000000000000000000000000000000";

const rawChain = (process.env.NEXT_PUBLIC_CHAIN || "").trim().toLowerCase();
const activeChain =
  rawChain === "polygon" || rawChain === "mainnet" ? polygon : polygonAmoy;

if (typeof window !== "undefined") {
  const isProd = process.env.NODE_ENV === "production";
  if (isProd && !rawProjectId) {
    // eslint-disable-next-line no-console
    console.warn(
      "[wagmi] Missing NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID. Wallet connections may fail."
    );
  }
}

export const wagmiConfig = getDefaultConfig({
  appName: "MintyDoc",
  projectId,
  chains: [activeChain],
  ssr: true,
});

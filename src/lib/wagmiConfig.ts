import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { polygonMumbai } from "wagmi/chains";

const projectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ??
  "00000000000000000000000000000000";

export const wagmiConfig = getDefaultConfig({
  appName: "MintyDoc",
  projectId,
  chains: [polygonMumbai],
  ssr: true,
});

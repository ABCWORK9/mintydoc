/* src/components/WalletConnector.tsx */
"use client"; // ⚡️ forces this file to be rendered only on the client

import { ConnectButton } from "@rainbow-me/rainbowkit";

/**
 * Simple wrapper around RainbowKit’s ConnectButton.
 * Because it lives in a client component, it can safely use
 * window, MetaMask, WalletConnect, etc. without triggering
 * hydration errors.
 */
export default function WalletConnector() {
  return <ConnectButton />;
}
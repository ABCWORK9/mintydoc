/* src/app/layout.tsx */
import type { Metadata } from "next";
import { IBM_Plex_Mono, Inter, Source_Serif_4 } from "next/font/google";
import "@rainbow-me/rainbowkit/styles.css";
import "./globals.css";

import WalletConnector from "@/components/client/WalletConnector";
import Web3Provider from "@/components/client/Web3Provider";

const fontUi = Inter({
  variable: "--font-ui",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const fontEditorial = Source_Serif_4({
  variable: "--font-editorial",
  subsets: ["latin"],
  weight: ["400", "600"],
});

const fontMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "MintyDoc MVP",
  description: "On‑chain document posting with Arweave & Polygon",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${fontUi.variable} ${fontEditorial.variable} ${fontMono.variable}`}>
      <body
        className="antialiased"
      >
        <Web3Provider>
          <WalletConnector />
          {children}
        </Web3Provider>
      </body>
    </html>
  );
}

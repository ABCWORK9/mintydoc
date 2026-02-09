import Arweave from "arweave";
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { defineChain } from "viem";

const docPayGoWorkerAbi = [
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "bytes32", name: "reservationId", type: "bytes32" },
      { indexed: true, internalType: "address", name: "payer", type: "address" },
      { indexed: false, internalType: "uint64", name: "sizeBytes", type: "uint64" },
      { indexed: false, internalType: "uint32", name: "priceCents", type: "uint32" },
      { indexed: false, internalType: "uint40", name: "expiresAt", type: "uint40" },
    ],
    name: "ReservationCreated",
    type: "event",
  },
  {
    inputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    name: "reservations",
    outputs: [
      { internalType: "address", name: "payer", type: "address" },
      { internalType: "uint64", name: "sizeBytes", type: "uint64" },
      { internalType: "uint32", name: "priceCents", type: "uint32" },
      { internalType: "uint40", name: "createdAt", type: "uint40" },
      { internalType: "uint40", name: "expiresAt", type: "uint40" },
      { internalType: "uint8", name: "status", type: "uint8" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "reservationId", type: "bytes32" },
      { internalType: "string", name: "arTx", type: "string" },
      { internalType: "string", name: "title", type: "string" },
      { internalType: "string", name: "mime", type: "string" },
    ],
    name: "finalizePost",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

const RESERVED_STATUS = 1;
const MAX_RETRIES = 3;

type StoredFile = {
  bytes: Uint8Array;
  title: string;
  mime: string;
};

function getChain() {
  const chainId = Number(process.env.CHAIN_ID ?? 0);
  if (!chainId) return null;
  return defineChain({
    id: chainId,
    name: process.env.CHAIN_NAME ?? "custom",
    network: process.env.CHAIN_NETWORK ?? "custom",
    nativeCurrency: {
      name: process.env.CHAIN_CURRENCY_NAME ?? "Native",
      symbol: process.env.CHAIN_CURRENCY_SYMBOL ?? "NATIVE",
      decimals: 18,
    },
    rpcUrls: {
      default: {
        http: [process.env.RPC_URL ?? ""],
      },
    },
  });
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function loadFileForReservation(_reservationId: string): Promise<StoredFile | null> {
  return null;
}

async function uploadToArweave(file: StoredFile) {
  const url = process.env.ARWEAVE_NODE_URL ?? "https://arweave.net";
  const { protocol, hostname, port } = new URL(url);
  const arweave = Arweave.init({
    host: hostname,
    port: port ? Number(port) : protocol === "https:" ? 443 : 80,
    protocol: protocol.replace(":", ""),
  });

  const b64 = process.env.ARWEAVE_WALLET_JSON_B64;
  if (!b64) {
    throw new Error("missing ARWEAVE_WALLET_JSON_B64");
  }
  const wallet = JSON.parse(Buffer.from(b64, "base64").toString("utf-8"));

  const tx = await arweave.createTransaction({ data: Buffer.from(file.bytes) }, wallet);
  if (file.mime) {
    tx.addTag("Content-Type", file.mime);
  }
  await arweave.transactions.sign(tx, wallet);
  const res = await arweave.transactions.post(tx);
  if (res.status >= 400) {
    throw new Error(`Arweave upload failed: ${res.status}`);
  }
  return tx.id as string;
}

class ReservationQueue {
  private queue: string[] = [];
  private running = false;
  private inFlight = new Set<string>();

  enqueue(reservationId: string) {
    if (this.inFlight.has(reservationId)) return;
    this.queue.push(reservationId);
    if (!this.running) {
      void this.process();
    }
  }

  private async process() {
    this.running = true;
    while (this.queue.length > 0) {
      const reservationId = this.queue.shift();
      if (!reservationId) continue;
      if (this.inFlight.has(reservationId)) continue;
      this.inFlight.add(reservationId);
      try {
        await processReservation(reservationId);
      } finally {
        this.inFlight.delete(reservationId);
      }
    }
    this.running = false;
  }
}

const queue = new ReservationQueue();

async function processReservation(reservationId: string) {
  const chain = getChain();
  const rpcUrl = process.env.RPC_URL;
  const contractAddress = process.env.DOC_PAY_GO_ADDRESS;
  const ownerKey = process.env.OWNER_PRIVATE_KEY;

  if (!chain || !rpcUrl || !contractAddress || !ownerKey) {
    console.error("reservation worker missing config", {
      hasChain: Boolean(chain),
      hasRpcUrl: Boolean(rpcUrl),
      hasContract: Boolean(contractAddress),
      hasOwnerKey: Boolean(ownerKey),
    });
    return;
  }

  const publicClient = createPublicClient({
    chain,
    transport: http(rpcUrl),
  });
  const account = privateKeyToAccount(ownerKey as `0x${string}`);
  const walletClient = createWalletClient({
    chain,
    transport: http(rpcUrl),
    account,
  });

  const reservation = await publicClient.readContract({
    address: contractAddress as `0x${string}`,
    abi: docPayGoWorkerAbi,
    functionName: "reservations",
    args: [reservationId as `0x${string}`],
  });

  const status = Number(reservation.status);
  if (status !== RESERVED_STATUS) return;

  const expiresAt = Number(reservation.expiresAt);
  const now = Math.floor(Date.now() / 1000);
  if (expiresAt && now > expiresAt) return;

  const file = await loadFileForReservation(reservationId);
  if (!file) {
    console.error("reservation worker missing file", { reservationId });
    return;
  }

  let arTx: string | null = null;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
    try {
      arTx = await uploadToArweave(file);
      break;
    } catch (err) {
      console.error("reservation worker upload failed", {
        reservationId,
        attempt: attempt + 1,
        error: err instanceof Error ? err.message : String(err),
      });
      await delay(500 * (attempt + 1));
    }
  }
  if (!arTx) return;

  await walletClient.writeContract({
    address: contractAddress as `0x${string}`,
    abi: docPayGoWorkerAbi,
    functionName: "finalizePost",
    args: [reservationId as `0x${string}`, arTx, file.title, file.mime],
    account,
  });

  console.log("reservation finalized", { reservationId, arTx });
}

export function startReservationAutoFinalizeWorker() {
  const chain = getChain();
  const rpcUrl = process.env.RPC_URL;
  const contractAddress = process.env.DOC_PAY_GO_ADDRESS;

  if (!chain || !rpcUrl || !contractAddress) {
    console.error("reservation worker missing config", {
      hasChain: Boolean(chain),
      hasRpcUrl: Boolean(rpcUrl),
      hasContract: Boolean(contractAddress),
    });
    return () => undefined;
  }

  const publicClient = createPublicClient({
    chain,
    transport: http(rpcUrl),
  });

  return publicClient.watchContractEvent({
    address: contractAddress as `0x${string}`,
    abi: docPayGoWorkerAbi,
    eventName: "ReservationCreated",
    onLogs: (logs) => {
      for (const log of logs) {
        const reservationId = log.args?.reservationId as string | undefined;
        if (!reservationId) continue;
        console.log("reservation received", { reservationId });
        queue.enqueue(reservationId);
      }
    },
  });
}

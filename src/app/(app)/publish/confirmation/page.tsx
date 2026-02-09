import AppShell from "@/components/layout/AppShell";
import Container from "@/components/layout/Container";
import Stack from "@/components/layout/Stack";
import Title from "@/components/typography/Title";
import Text from "@/components/typography/Text";
import Meta from "@/components/typography/Meta";
import { getExplorerTxUrl } from "@/lib/chain";
import { docPayGoAbi } from "@/lib/contractAbi";
import { createPublicClient, defineChain, http, type Hex } from "viem";
import { keccak256, toBytes } from "viem";

const reservationReadAbi = [
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
] as const;

const RESERVED_STATUS = 1;

type PageProps = {
  searchParams?: {
    reservationId?: string;
    reserveTxHash?: string;
    finalizeTxHash?: string;
  };
};

type PostStatus = "finalized" | "expired" | "storing" | "paid";

type ProofData = {
  reservationId: string;
  status: PostStatus;
  paymentTxUrl?: string;
  finalizeTxUrl?: string;
  arweaveUrl?: string;
  metadata: {
    title: string;
    category: string;
    otherCategory: string;
    keywords: string;
    sizeBytes: number;
    mime: string;
    timestamp: number;
    docId: string;
  };
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

export default async function Page({ searchParams }: PageProps) {
  const reservationId = searchParams?.reservationId ?? "";
  const reserveTxHash = searchParams?.reserveTxHash ?? "";
  const finalizeTxHash = searchParams?.finalizeTxHash ?? "";

  if (!reservationId) {
    return (
      <AppShell>
        <Container size="content">
          <Stack gap="sm">
            <Title level="h1">Confirmation</Title>
            <Text>Missing reservation id.</Text>
          </Stack>
        </Container>
      </AppShell>
    );
  }

  const chain = getChain();
  const rpcUrl = process.env.RPC_URL;
  const contractAddress = process.env.DOC_PAY_GO_ADDRESS as Hex | undefined;

  if (!chain || !rpcUrl || !contractAddress) {
    return (
      <AppShell>
        <Container size="content">
          <Stack gap="sm">
            <Title level="h1">Confirmation</Title>
            <Text>Missing chain configuration.</Text>
          </Stack>
        </Container>
      </AppShell>
    );
  }

  const client = createPublicClient({ chain, transport: http(rpcUrl) });

  const reservation = (await client.readContract({
    address: contractAddress,
    abi: reservationReadAbi,
    functionName: "reservations",
    args: [reservationId as Hex],
  })) as readonly [string, bigint, bigint, bigint, bigint, bigint];

  const reservationStatus = Number(reservation[5]);
  const reservationExpiresAt = Number(reservation[4]);

  let arTx = "";
  let docId = "";
  let doc: readonly [string, string, string, string, bigint, bigint] | null = null;

  if (finalizeTxHash) {
    const receipt = await client.getTransactionReceipt({
      hash: finalizeTxHash as Hex,
    });
    const finalizedLog = receipt.logs.find(
      (log) => log.address.toLowerCase() === contractAddress.toLowerCase()
    );
    if (finalizedLog) {
      const decoded = client.decodeEventLog({
        abi: docPayGoAbi,
        data: finalizedLog.data,
        topics: finalizedLog.topics,
      });
      if (decoded.eventName === "ReservationFinalized") {
        arTx = decoded.args.arTx as string;
      }
    }
  }

  if (arTx) {
    docId = keccak256(toBytes(arTx));
    doc = (await client.readContract({
      address: contractAddress,
      abi: docPayGoAbi,
      functionName: "docs",
      args: [docId],
    })) as readonly [string, string, string, string, bigint, bigint];
  }

  const docExists = Boolean(doc && doc[0] && doc[0] !== "0x0000000000000000000000000000000000000000");
  const now = Math.floor(Date.now() / 1000);

  let status: PostStatus = "paid";
  if (docExists) {
    status = "finalized";
  } else if (reservationStatus === RESERVED_STATUS && now <= reservationExpiresAt) {
    status = "storing";
  } else if (reservationStatus === RESERVED_STATUS && now > reservationExpiresAt) {
    status = "expired";
  }

  const proof: ProofData = {
    reservationId,
    status,
    paymentTxUrl: reserveTxHash ? getExplorerTxUrl(reserveTxHash) : undefined,
    finalizeTxUrl: finalizeTxHash ? getExplorerTxUrl(finalizeTxHash) : undefined,
    arweaveUrl: arTx ? `https://arweave.net/${arTx}` : undefined,
    metadata: {
      title: doc?.[2] ?? "",
      category: "",
      otherCategory: "",
      keywords: "",
      sizeBytes: doc ? Number(doc[4]) : Number(reservation[1]),
      mime: doc?.[3] ?? "",
      timestamp: doc ? Number(doc[5]) : 0,
      docId: docId || "",
    },
  };

  return (
    <AppShell>
      <Container size="content">
        <Stack gap="sm">
          <Title level="h1">{status === "finalized" ? "Post finalized" : "Post status"}</Title>
          <Meta>Status: {status}</Meta>

          <Stack gap="xs">
            {proof.paymentTxUrl ? (
              <a href={proof.paymentTxUrl} target="_blank" rel="noreferrer">
                Payment transaction
              </a>
            ) : null}
            {proof.finalizeTxUrl ? (
              <a href={proof.finalizeTxUrl} target="_blank" rel="noreferrer">
                Finalize transaction
              </a>
            ) : null}
            {proof.arweaveUrl ? (
              <a href={proof.arweaveUrl} target="_blank" rel="noreferrer">
                View on Arweave
              </a>
            ) : null}
          </Stack>

          <Stack gap="xs">
            <Text>reservationId: {proof.reservationId}</Text>
            <Text>docId: {proof.metadata.docId || ""}</Text>
            <Text>title: {proof.metadata.title || ""}</Text>
            <Text>category: {proof.metadata.category || ""}</Text>
            <Text>otherCategory: {proof.metadata.otherCategory || ""}</Text>
            <Text>keywords: {proof.metadata.keywords || ""}</Text>
            <Text>sizeBytes: {proof.metadata.sizeBytes}</Text>
            <Text>mime: {proof.metadata.mime || ""}</Text>
            <Text>timestamp: {proof.metadata.timestamp || 0}</Text>
          </Stack>
        </Stack>
      </Container>
    </AppShell>
  );
}

import AppShell from "@/components/layout/AppShell";
import Container from "@/components/layout/Container";
import Stack from "@/components/layout/Stack";
import Title from "@/components/typography/Title";
import Text from "@/components/typography/Text";
import Meta from "@/components/typography/Meta";
import MetaBlock from "@/components/docs/MetaBlock";
import MetaRow from "@/components/docs/MetaRow";
import ProofBlock from "@/components/docs/ProofBlock";
import DocumentPreviewFrame from "@/components/docs/DocumentPreviewFrame";
import { notFound } from "next/navigation";

export const metadata = {
  title: "Minty News",
  description:
    "A verified Minty news entry permanently archived on Arweave.",
};

export const revalidate = 60;

const GATEWAY_URL = "https://arweave.net";

type ArweaveTag = {
  name: string;
  value: string;
};

type ArweaveTransaction = {
  id: string;
  owner: { address: string };
  block: { height: number; timestamp: number } | null;
  tags: ArweaveTag[];
};

type ArweaveResponse = {
  data?: {
    transaction?: ArweaveTransaction | null;
  };
};

function getTagValue(tags: ArweaveTag[], name: string) {
  const match = tags.find((tag) => tag.name === name);
  return match?.value;
}

function formatDate(timestamp?: number | null) {
  if (!timestamp) return "Unknown date";
  return new Date(timestamp * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function shortenId(id: string) {
  if (id.length <= 10) return id;
  return `${id.slice(0, 6)}...${id.slice(-4)}`;
}

function shortenAddress(address: string) {
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

type PageProps = {
  params: { id: string };
};

export default async function Page({ params }: PageProps) {
  const query = `
    query NewsItem($id: ID!) {
      transaction(id: $id) {
        id
        owner { address }
        block { height timestamp }
        tags { name value }
      }
    }
  `;

  const response = await fetch("https://arweave.net/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables: { id: params.id } }),
    cache: "no-store",
  });
  if (!response.ok) {
    notFound();
  }
  const json = (await response.json()) as ArweaveResponse;
  const tx = json.data?.transaction ?? null;
  if (!tx) {
    notFound();
  }

  const category = getTagValue(tx.tags, "Minty-Category");
  if (category !== "news") {
    notFound();
  }

  const entryType = getTagValue(tx.tags, "Minty-EntryType") ?? "News";
  const displayDate = formatDate(tx.block?.timestamp);
  const shortId = shortenId(tx.id);
  const gatewayUrl = `${GATEWAY_URL}/${tx.id}`;

  let contentOk = false;
  try {
    const contentRes = await fetch(gatewayUrl, { cache: "no-store" });
    contentOk = contentRes.ok;
  } catch {
    contentOk = false;
  }

  return (
    <AppShell>
      <Container size="reading">
        <Stack gap="md">
          <Stack gap="xs">
            <Title level="h1">Minty News</Title>
            <Text>News entry</Text>
          </Stack>

          <MetaBlock>
            <MetaRow label="Entry Type">{entryType}</MetaRow>
            <MetaRow label="Publisher">
              {shortenAddress(tx.owner.address)}
            </MetaRow>
            <MetaRow label="Uploaded">{displayDate}</MetaRow>
            <MetaRow label="Transaction">{shortId}</MetaRow>
          </MetaBlock>

          <DocumentPreviewFrame width="content">
            {contentOk ? (
              <iframe
                title="Minty News Content"
                src={gatewayUrl}
                className="w-full"
                style={{ height: "70vh" }}
              />
            ) : (
              <div className="p-4">
                <Meta className="text-muted">Unable to load content.</Meta>
              </div>
            )}
          </DocumentPreviewFrame>

          <ProofBlock
            showDivider
            rows={[{ label: "Arweave TXID", value: tx.id }]}
          />
        </Stack>
      </Container>
    </AppShell>
  );
}

import Container from "@/components/layout/Container";
import Stack from "@/components/layout/Stack";
import Title from "@/components/typography/Title";
import Text from "@/components/typography/Text";
import Meta from "@/components/typography/Meta";
import Link from "next/link";

export const metadata = {
  title: "Minty News",
  description: "Official news entries published to the Minty archive.",
};

export const revalidate = 60;

const PAGE_SIZE = 20;

type ArweaveTag = {
  name: string;
  value: string;
};

type ArweaveTxNode = {
  id: string;
  owner: { address: string };
  block: { height: number; timestamp: number } | null;
  tags: ArweaveTag[];
};

type ArweaveEdge = {
  cursor: string;
  node: ArweaveTxNode;
};

type ArweaveResponse = {
  data?: {
    transactions?: {
      edges: ArweaveEdge[];
    };
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

function formatEntryType(value?: string) {
  if (!value) return "News";
  if (value === "primary") return "Primary";
  if (value === "secondary") return "Secondary";
  if (value === "commentary") return "Commentary";
  return value;
}

export default async function Page({
  searchParams,
}: {
  searchParams?: { after?: string };
}) {
  const after = searchParams?.after;
  const query = `
    query News($first: Int!, $after: String) {
      transactions(
        first: $first
        after: $after
        sort: HEIGHT_DESC
        tags: [{ name: "Minty-Category", values: ["news"] }]
      ) {
        edges {
          cursor
          node {
            id
            owner { address }
            block { height timestamp }
            tags { name value }
          }
        }
      }
    }
  `;

  let edges: ArweaveEdge[] = [];
  try {
    const res = await fetch("https://arweave.net/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        variables: { first: PAGE_SIZE, after: after ?? null },
      }),
      cache: "no-store",
    });
    const json = (await res.json()) as ArweaveResponse;
    edges = json.data?.transactions?.edges ?? [];
  } catch {
    edges = [];
  }
  const lastCursor = edges.at(-1)?.cursor;

  return (
    <Container size="content">
      <Stack gap="md">
        <Stack gap="xs">
          <Title level="h1">Minty News</Title>
          <Text>Latest news entries from the Minty archive.</Text>
        </Stack>

        <Stack gap="sm">
          {edges.length === 0 ? (
            <Meta className="text-muted">No news items yet.</Meta>
          ) : (
            edges.map((edge) => {
              const item = edge.node;
              const entryType = getTagValue(item.tags, "Minty-EntryType");
              const entryLabel = formatEntryType(entryType);
              return (
                <Link
                  key={item.id}
                  href={`/news/${item.id}`}
                  className="block rounded-md border border-rule p-3 hover:opacity-90"
                >
                  <Stack gap="xs">
                    <Text className="text-muted text-sm">{entryLabel}</Text>
                    <Meta className="text-muted">
                      {formatDate(item.block?.timestamp)} · {shortenId(item.id)}
                    </Meta>
                  </Stack>
                </Link>
              );
            })
          )}
        </Stack>
        {edges.length === PAGE_SIZE && lastCursor ? (
          <Link
            href={`/news?after=${encodeURIComponent(lastCursor)}`}
            className="text-sm underline"
          >
            Next →
          </Link>
        ) : null}
      </Stack>
    </Container>
  );
}

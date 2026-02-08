import AppShell from "@/components/layout/AppShell";
import Container from "@/components/layout/Container";
import Stack from "@/components/layout/Stack";
import Title from "@/components/typography/Title";
import { DocList } from "@/components/lists/DocList";
import type { DocRowData } from "@/components/lists/DocRow";

const placeholderDocs: DocRowData[] = [
  {
    id: "doc-001",
    title: "Atlas of Water Systems (Draft)",
    createdAt: "2026-02-01",
    owner: "0x1111222233334444555566667777888899990000",
    sizeBytes: 2_450_000,
    proofId: "proof-1a2b3c4d",
  },
  {
    id: "doc-002",
    title: "On-Chain Research Notes",
    createdAt: "2026-01-29",
    owner: "0xaaaabbbbccccddddeeeeffff0000111122223333",
    sizeBytes: 980_000,
    proofId: "proof-9f8e7d6c",
  },
  {
    id: "doc-003",
    title: "Longform Memo: Open Archives",
    createdAt: "2026-01-21",
    owner: "0x1234567890abcdef1234567890abcdef12345678",
    sizeBytes: 5_120_000,
    proofId: "proof-4d3c2b1a",
  },
];

export default function Page() {
  return (
    <AppShell>
      <Container size="content">
        <Stack gap="sm">
          <Title level="h1">Recent</Title>
          <DocList docs={placeholderDocs} />
        </Stack>
      </Container>
    </AppShell>
  );
}

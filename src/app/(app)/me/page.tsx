import AppShell from "@/components/layout/AppShell";
import Container from "@/components/layout/Container";
import Stack from "@/components/layout/Stack";
import Title from "@/components/typography/Title";
import DocList from "@/components/lists/DocList";
import type { DocRowData } from "@/components/lists/DocRow";

const placeholderDocs: DocRowData[] = [
  {
    id: "my-001",
    title: "Private Research Draft",
    createdAt: "2026-01-18",
    owner: "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
    sizeBytes: 1_240_000,
  },
  {
    id: "my-002",
    title: "Note to Self: Archive Plan",
    createdAt: "2026-01-10",
    owner: "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
    proofId: "proof-7e6d5c4b",
  },
];

export default function Page() {
  return (
    <AppShell>
      <Container size="content">
        <Stack gap="sm">
          <Title level="h1">My Account</Title>
          <DocList docs={placeholderDocs} />
        </Stack>
      </Container>
    </AppShell>
  );
}

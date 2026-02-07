import AppShell from "@/components/layout/AppShell";
import Container from "@/components/layout/Container";
import Stack from "@/components/layout/Stack";
import Title from "@/components/typography/Title";
import Text from "@/components/typography/Text";
import MetaBlock from "@/components/docs/MetaBlock";
import MetaRow from "@/components/docs/MetaRow";
import ProofBlock from "@/components/docs/ProofBlock";
import DocumentPreviewFrame from "@/components/docs/DocumentPreviewFrame";

type DocPageProps = {
  params: { id: string };
};

export default function DocPage({ params }: DocPageProps) {
  return (
    <AppShell>
      <Container size="reading">
        <Stack gap="md">
          <Stack gap="xs">
            <Title level="h1">Document</Title>
            <Text>Archive entry</Text>
          </Stack>

          <MetaBlock>
            <MetaRow label="Document ID">{params.id}</MetaRow>
            <MetaRow label="Author">0x0000…0000</MetaRow>
            <MetaRow label="Uploaded">Jan 1, 2026</MetaRow>
          </MetaBlock>

          <DocumentPreviewFrame width="content">
            <div>
              <Text>Placeholder for document preview.</Text>
            </div>
          </DocumentPreviewFrame>

          <ProofBlock
            showDivider
            rows={[
              { label: "Arweave TXID", value: "placeholder-txid" },
              { label: "On-chain Hash", value: "0x0000…0000" },
            ]}
          />
        </Stack>
      </Container>
    </AppShell>
  );
}

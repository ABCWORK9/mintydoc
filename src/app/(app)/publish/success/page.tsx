import AppShell from "@/components/layout/AppShell";
import Container from "@/components/layout/Container";
import Stack from "@/components/layout/Stack";
import Title from "@/components/typography/Title";
import Text from "@/components/typography/Text";
import ProofBlock from "@/components/docs/ProofBlock";

export default function Page() {
  return (
    <AppShell>
      <Container size="content">
        <Stack gap="sm">
          <Title level="h1">Publish Success</Title>
          <Text>Placeholder for success state.</Text>
          <ProofBlock
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

import AppShell from "@/components/layout/AppShell";
import Container from "@/components/layout/Container";
import Stack from "@/components/layout/Stack";
import Title from "@/components/typography/Title";
import Text from "@/components/typography/Text";
import Meta from "@/components/typography/Meta";
import Proof from "@/components/typography/Proof";

type DocPageProps = {
  params: { id: string };
};

export default function DocPage({ params }: DocPageProps) {
  return (
    <AppShell>
      <Container size="reading">
        <Stack gap="sm">
          <Title level="h1">Document</Title>
          <Meta>
            Document ID: <Proof>{params.id}</Proof>
          </Meta>
          <Text>Placeholder for document content and metadata.</Text>
        </Stack>
      </Container>
    </AppShell>
  );
}

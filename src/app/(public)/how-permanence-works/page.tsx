import AppShell from "@/components/layout/AppShell";
import Container from "@/components/layout/Container";
import Stack from "@/components/layout/Stack";
import Title from "@/components/typography/Title";
import Text from "@/components/typography/Text";

export default function PermanencePage() {
  return (
    <AppShell>
      <Container size="reading">
        <Stack gap="sm">
          <Title level="h1">How Permanence Works</Title>
          <Text>
            Placeholder. TODO: render content/docs/how-permanence-works.mdx.
          </Text>
        </Stack>
      </Container>
    </AppShell>
  );
}

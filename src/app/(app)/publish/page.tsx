import AppShell from "@/components/layout/AppShell";
import Container from "@/components/layout/Container";
import Stack from "@/components/layout/Stack";
import Title from "@/components/typography/Title";
import Text from "@/components/typography/Text";

export default function Page() {
  return (
    <AppShell>
      <Container size="content">
        <Stack gap="sm">
          <Title level="h1">Publish</Title>
          <Text>Placeholder for publish flow.</Text>
        </Stack>
      </Container>
    </AppShell>
  );
}

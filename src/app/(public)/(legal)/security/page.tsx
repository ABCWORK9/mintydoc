import AppShell from "@/components/layout/AppShell";
import Container from "@/components/layout/Container";
import Stack from "@/components/layout/Stack";
import Title from "@/components/typography/Title";
import Text from "@/components/typography/Text";

export default function Page() {
  return (
    <AppShell>
      <Container size="reading">
        <Stack gap="sm">
          <Title level="h1">Security</Title>
          <Text>Placeholder for security content.</Text>
        </Stack>
      </Container>
    </AppShell>
  );
}

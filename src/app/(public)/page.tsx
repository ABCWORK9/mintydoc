import AppShell from "@/components/layout/AppShell";
import Container from "@/components/layout/Container";
import Stack from "@/components/layout/Stack";
import UploadForm from "@/components/client/UploadForm";
import Title from "@/components/typography/Title";
import Text from "@/components/typography/Text";

export default function Page() {
  return (
    <AppShell>
      <Container size="content">
        <Stack gap="md">
          <Title level="h1">Home</Title>
          <Text>Placeholder for home content.</Text>
          <UploadForm />
        </Stack>
      </Container>
    </AppShell>
  );
}

import AppShell from "@/components/layout/AppShell";
import Container from "@/components/layout/Container";
import Stack from "@/components/layout/Stack";
import Title from "@/components/typography/Title";
import Text from "@/components/typography/Text";
import UploadForm from "@/components/client/UploadForm";

export default function Page() {
  return (
    <AppShell>
      <Container size="content">
        <Stack gap="md">
          <Stack gap="xs">
            <Title level="h1">Publish</Title>
            <Text>Post a document permanently on-chain.</Text>
          </Stack>

          <Stack gap="xs">
            <Title level="h2">Upload</Title>
            <UploadForm />
          </Stack>

          <Stack gap="xs">
            <Title level="h2">Review</Title>
            <Text>
              TODO: review and permanence details are currently rendered inside
              the uploader.
            </Text>
          </Stack>

          <Stack gap="xs">
            <Title level="h2">Actions</Title>
            <Text>
              TODO: action buttons are currently rendered inside the uploader.
            </Text>
          </Stack>
        </Stack>
      </Container>
    </AppShell>
  );
}

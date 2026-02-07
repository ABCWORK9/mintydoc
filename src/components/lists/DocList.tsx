import Stack from "@/components/layout/Stack";
import Divider from "@/components/ui/Divider";
import Meta from "@/components/typography/Meta";
import { DocRow, type DocRowData } from "@/components/lists/DocRow";

type DocListProps = {
  docs: DocRowData[];
};

export function DocList({ docs }: DocListProps) {
  if (!docs.length) {
    return <Meta>No documents yet.</Meta>;
  }

  return (
    <Stack gap="sm">
      {docs.map((doc, index) => (
        <Stack key={doc.id} gap="sm">
          <DocRow data={doc} />
          {index < docs.length - 1 ? <Divider /> : null}
        </Stack>
      ))}
    </Stack>
  );
}

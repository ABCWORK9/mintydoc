import Link from "next/link";
import Stack from "@/components/layout/Stack";
import Title from "@/components/typography/Title";
import Text from "@/components/typography/Text";
import Meta from "@/components/typography/Meta";
import Proof from "@/components/typography/Proof";
import { formatDate } from "@/lib/format/date";
import { formatAddress } from "@/lib/format/address";
import { formatBytes } from "@/lib/format/bytes";

export type DocRowData = {
  id: string;
  title: string;
  createdAt?: Date | string | number;
  owner?: string;
  sizeBytes?: number;
  proofId?: string;
  href?: string;
};

type DocRowProps = {
  data: DocRowData;
};

export function DocRow({ data }: DocRowProps) {
  function shortProof(value: string) {
    if (!value) return "";
    if (value.length <= 12) return value;
    return `${value.slice(0, 6)}…${value.slice(-4)}`;
  }

  const title = data.title?.trim() ? data.title : "Untitled document";
  const href = data.href ?? `/docs/${data.id}`;

  const metaParts: string[] = [];
  if (data.createdAt) {
    const formatted = formatDate(data.createdAt);
    if (formatted) metaParts.push(formatted);
  }
  if (data.owner) {
    const formatted = formatAddress(data.owner);
    if (formatted) metaParts.push(formatted);
  }
  if (typeof data.sizeBytes === "number") {
    metaParts.push(formatBytes(data.sizeBytes));
  }
  const metaLine = metaParts.join(" · ");

  return (
    <Link href={href}>
      <Stack gap="xs">
        <Title level="h3">{title}</Title>
        <Meta>{metaLine}</Meta>
        {data.proofId ? (
          <Proof>Proof: {shortProof(data.proofId)}</Proof>
        ) : (
          <Proof></Proof>
        )}
      </Stack>
    </Link>
  );
}

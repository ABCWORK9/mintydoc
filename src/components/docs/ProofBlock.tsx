import Divider from "@/components/ui/Divider";
import Stack from "@/components/layout/Stack";
import Proof from "@/components/typography/Proof";
import Meta from "@/components/typography/Meta";
import { cn } from "@/lib/utils/cn";

type ProofRowProps = {
  label: string;
  value: React.ReactNode;
};

type ProofBlockProps = {
  rows: ProofRowProps[];
  showDivider?: boolean;
  className?: string;
};

export default function ProofBlock({ rows, showDivider = false, className }: ProofBlockProps) {
  return (
    <Stack gap="xs" className={className}>
      {showDivider ? <Divider /> : null}
      {rows.map((row) => (
        <div key={row.label} className="flex items-start justify-between">
          <Meta>{row.label}</Meta>
          <Proof>{row.value}</Proof>
        </div>
      ))}
    </Stack>
  );
}

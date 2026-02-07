import Meta from "@/components/typography/Meta";
import Text from "@/components/typography/Text";
import { cn } from "@/lib/utils/cn";

type MetaRowProps = {
  label: string;
  children: React.ReactNode;
  className?: string;
};

export default function MetaRow({ label, children, className }: MetaRowProps) {
  return (
    <div className={cn("flex items-start justify-between", className)}>
      <Meta>{label}</Meta>
      <Text>{children}</Text>
    </div>
  );
}

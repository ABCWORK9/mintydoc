import { cn } from "@/lib/utils/cn";

type MetaProps = {
  className?: string;
  children: React.ReactNode;
};

export default function Meta({ className, children }: MetaProps) {
  return <small className={cn("font-ui", className)}>{children}</small>;
}

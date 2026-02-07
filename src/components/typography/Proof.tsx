import { cn } from "@/lib/utils/cn";

type ProofProps = {
  className?: string;
  children: React.ReactNode;
};

export default function Proof({ className, children }: ProofProps) {
  return <code className={cn("font-mono", className)}>{children}</code>;
}

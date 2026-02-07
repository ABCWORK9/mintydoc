import { cn } from "@/lib/utils/cn";

type TextProps = {
  className?: string;
  children: React.ReactNode;
};

export default function Text({ className, children }: TextProps) {
  return <p className={cn("font-editorial", className)}>{children}</p>;
}

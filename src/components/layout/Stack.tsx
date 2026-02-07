import { cn } from "@/lib/utils/cn";

export type StackGap = "xs" | "sm" | "md" | "lg";

type StackProps = {
  gap?: StackGap;
  className?: string;
  children: React.ReactNode;
};

const gapClass: Record<StackGap, string> = {
  xs: "gap-2",
  sm: "gap-3",
  md: "gap-4",
  lg: "gap-6",
};

export default function Stack({ gap = "md", className, children }: StackProps) {
  return (
    <div className={cn("flex flex-col", gapClass[gap], className)}>
      {children}
    </div>
  );
}

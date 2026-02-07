import { cn } from "@/lib/utils/cn";

export type StackGap = "xs" | "sm" | "md" | "lg" | "xl";

type StackProps = {
  gap?: StackGap;
  className?: string;
  children: React.ReactNode;
};

// gap intent: xs=tight UI clusters, sm=related text, md=section default, lg=section breaks, xl=page-level separation
const gapClass: Record<StackGap, string> = {
  xs: "gap-1",
  sm: "gap-2",
  md: "gap-4",
  lg: "gap-6",
  xl: "gap-8",
};

export default function Stack({ gap = "md", className, children }: StackProps) {
  return (
    <div className={cn("flex flex-col", gapClass[gap], className)}>
      {children}
    </div>
  );
}

import { cn } from "@/lib/utils/cn";

export type ContainerSize = "reading" | "content" | "wide";

type ContainerProps = {
  size?: ContainerSize;
  className?: string;
  children: React.ReactNode;
};

const sizeClass: Record<ContainerSize, string> = {
  reading: "max-w-reading",
  content: "max-w-content",
  wide: "max-w-wide",
};

export default function Container({
  size = "content",
  className,
  children,
}: ContainerProps) {
  return (
    <div className={cn("w-full mx-auto px-4", sizeClass[size], className)}>
      {children}
    </div>
  );
}

import { cn } from "@/lib/utils/cn";

export type TitleLevel = "h1" | "h2" | "h3";

type TitleProps = {
  level?: TitleLevel;
  className?: string;
  children: React.ReactNode;
};

export default function Title({ level = "h1", className, children }: TitleProps) {
  const Component = level;
  return <Component className={cn("font-editorial", className)}>{children}</Component>;
}

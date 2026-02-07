import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  className?: string;
};

export default function Button({ className, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={cn(
        "border-hairline border-rule rounded-sm text-ink bg-transparent",
        "hover:opacity-90",
        className
      )}
    />
  );
}

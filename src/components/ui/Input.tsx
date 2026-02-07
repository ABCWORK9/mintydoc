import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  className?: string;
};

export default function Input({ className, ...props }: InputProps) {
  return (
    <input
      {...props}
      className={cn(
        "border-hairline border-rule rounded-sm bg-transparent text-ink",
        className
      )}
    />
  );
}

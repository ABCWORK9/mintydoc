import { cn } from "@/lib/utils/cn";

export type PreviewWidth = "reading" | "content" | "wide";

type DocumentPreviewFrameProps = {
  width?: PreviewWidth;
  className?: string;
  children: React.ReactNode;
};

const widthClass: Record<PreviewWidth, string> = {
  reading: "max-w-reading",
  content: "max-w-content",
  wide: "max-w-wide",
};

export default function DocumentPreviewFrame({
  width = "content",
  className,
  children,
}: DocumentPreviewFrameProps) {
  return (
    <div className={cn("w-full", widthClass[width], className)}>
      <div className="border-hairline border-rule rounded-sm">
        {children}
      </div>
    </div>
  );
}

import Stack from "@/components/layout/Stack";

export default function MetaBlock({ children }: { children: React.ReactNode }) {
  return <Stack gap="xs">{children}</Stack>;
}

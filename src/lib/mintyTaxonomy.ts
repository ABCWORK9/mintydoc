export const MINTY_CATEGORIES = [
  { value: "research", label: "Research" },
  { value: "legal", label: "Legal" },
  { value: "finance", label: "Finance" },
  { value: "real-estate", label: "Real Estate" },
  { value: "construction", label: "Construction" },
  { value: "government", label: "Government / Compliance" },
  { value: "marketing", label: "Marketing / Sales" },
  { value: "personal", label: "Personal" },
  { value: "news", label: "News" },
  { value: "other", label: "Other" },
] as const;

export type MintyCategory = (typeof MINTY_CATEGORIES)[number]["value"];

/**
 * Normalizes a comma-separated keyword string into a small list
 * suitable for a single Arweave tag value.
 */
export function normalizeKeywords(input: string): string[] {
  return input
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 12);
}

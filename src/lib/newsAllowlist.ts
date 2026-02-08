function parseAllowlist(envValue?: string): Set<string> {
  if (!envValue) return new Set();
  return new Set(
    envValue
      .split(",")
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0)
      .map((entry) => entry.toLowerCase())
  );
}

function normalizeAddress(addr: string): string {
  return addr.trim().toLowerCase();
}

export function canPostNews(address?: string | null): boolean {
  if (!address) return false;
  const allowlist = parseAllowlist(process.env.NEWS_ALLOWLIST);
  if (allowlist.size === 0) return false;
  return allowlist.has(normalizeAddress(address));
}

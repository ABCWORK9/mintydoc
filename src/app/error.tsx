"use client";

import AppShell from "@/components/layout/AppShell";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <AppShell>
      <h1>Something went wrong</h1>
      <p>Please try again. If the issue persists, refresh the page.</p>
      <button onClick={reset}>Try again</button>
      {error?.digest && <p>Error ID: {error.digest}</p>}
    </AppShell>
  );
}

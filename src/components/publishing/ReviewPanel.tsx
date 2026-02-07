import React from "react";
import Text from "@/components/typography/Text";
import Input from "@/components/ui/Input";


type ReviewPanelProps = {
  arTx: string;
  title: string;
  setTitle: (value: string) => void;
  mime: string;
  setMime: (value: string) => void;
  breakdown: {
    sizeMb: number;
    arweaveCents: number;
    baseFeeCents: number;
    markupCents: number;
    totalCents: number;
  } | null;
  priceUsd: string;
  priceCents: number;
  usdcUnits: bigint;
  quote: unknown;
  status: string;
  uploadProgress: number;
};

export default function ReviewPanel({
  arTx,
  title,
  setTitle,
  mime,
  setMime,
  breakdown,
  priceUsd,
  priceCents,
  usdcUnits,
  quote,
  status,
  uploadProgress,
}: ReviewPanelProps) {
  return (
    <>
      <div
  className="grid grid-cols-1 gap-3"
  suppressHydrationWarning
>
        <Input
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          placeholder="Arweave TXID (auto-filled)"
          value={arTx}
          readOnly
        />
        <Input
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          placeholder="Title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Input
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          placeholder="MIME type (auto-filled)"
          value={mime}
          onChange={(e) => setMime(e.target.value)}
        />
      </div>

      <div className="rounded bg-gray-50 p-3 text-sm text-gray-700">
        <div className="font-medium text-gray-900">Price Breakdown</div>
        {!breakdown && (
          <div className="mt-1">Select a file to see pricing.</div>
        )}
        {breakdown && (
          <div className="mt-2 space-y-1">
            <div>Size: {breakdown.sizeMb} MB</div>
            <div>Processing fee: {breakdown.baseFeeCents}¢</div>
            <div>Arweave storage fee: {breakdown.arweaveCents}¢</div>
            <div>Posting fee: {breakdown.markupCents}¢</div>
            <div className="pt-1 font-medium">
              Total: ${priceUsd} ({priceCents}¢)
            </div>
            <div>USDC (6 decimals): {usdcUnits.toString()}</div>
            {!quote && (
              <div className="text-xs text-gray-500">
                Estimated price. Final price locks after upload.
              </div>
            )}
          </div>
        )}
      </div>

      {status === "uploading" && (
        <div className="space-y-2">
          <Text className="text-sm text-gray-600">
            Uploading to Arweave...
          </Text>
          <div className="h-2 w-full rounded bg-gray-200">
            <div
              className="h-2 rounded bg-indigo-600 transition-all"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}
    </>
  );
}

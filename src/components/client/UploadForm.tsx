"use client";

import React, { useMemo, useState } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { docPayGoAbi } from "@/lib/contractAbi";
import { erc20Abi } from "@/lib/erc20Abi";
import { centsToUsdcUnits, getPricingBreakdown } from "@/lib/pricing";
import { DOC_PAY_GO_ADDRESS, USDC_ADDRESS } from "@/lib/contracts";

type UploadState =
  | "idle"
  | "uploading"
  | "approving"
  | "posting"
  | "done"
  | "error";

export default function UploadForm() {
  const { address, isConnected } = useAccount();
  const [file, setFile] = useState<File | null>(null);
  const [arTx, setArTx] = useState("");
  const [title, setTitle] = useState("");
  const [mime, setMime] = useState("");
  const [status, setStatus] = useState<UploadState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [arweaveUrl, setArweaveUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [quote, setQuote] = useState<{
    priceCents: number;
    expiresAt: number;
    signature: `0x${string}`;
    breakdown: {
      arweaveCents: number;
      baseFeeCents: number;
      markupCents: number;
      totalCents: number;
    };
  } | null>(null);
  const [showPricingInfo, setShowPricingInfo] = useState(false);
  const [showSafetyInfo, setShowSafetyInfo] = useState(false);
  const [devMode, setDevMode] = useState<boolean | null>(null);
  const [showFileTypes, setShowFileTypes] = useState(false);

  function formatError(message: string) {
    const msg = message.toLowerCase();
    if (msg.includes("connect your wallet")) return "Please connect your wallet.";
    if (msg.includes("unsupported file type"))
      return "Unsupported file type. Try PDF, image, audio, or zip.";
    if (msg.includes("file type not allowed"))
      return "Executable files are blocked for safety.";
    if (msg.includes("quote expired")) return "Quote expired. Please try again.";
    if (msg.includes("price"))
      return "Pricing failed. Please try again in a moment.";
    if (msg.includes("upload failed"))
      return "Upload failed. Please retry.";
    if (msg.includes("virus") || msg.includes("malware"))
      return "Upload blocked for safety (malware detected).";
    return message;
  }
  const [estimate, setEstimate] = useState<{
    priceCents: number;
    breakdown: {
      arweaveCents: number;
      baseFeeCents: number;
      markupCents: number;
      totalCents: number;
    };
  } | null>(null);

  const { writeContractAsync } = useWriteContract();

  const sizeBytes = file?.size ?? 0;
  const priceCents = quote?.priceCents ?? estimate?.priceCents ?? 0;
  const usdcUnits = useMemo(
    () => centsToUsdcUnits(priceCents),
    [priceCents]
  );
  const priceUsd = useMemo(
    () => (priceCents / 100).toFixed(2),
    [priceCents]
  );
  const breakdown = useMemo(() => {
    const source = quote ?? estimate;
    if (!source || sizeBytes === 0) return null;
    return getPricingBreakdown({
      sizeBytes,
      arweaveCents: source.breakdown.arweaveCents,
    });
  }, [quote, estimate, sizeBytes]);

  async function handleUploadToArweave() {
    setError(null);
    if (!file) {
      setError("Choose a file first.");
      return;
    }
    try {
      setStatus("uploading");
      setUploadProgress(0);
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/arweave/upload", {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Upload failed.");
      }
      const data = await res.json();
      setArTx(data.txId);
      setArweaveUrl(data.url);
      setDevMode(Boolean(data.devMode));
      if (isConnected && address) {
        await fetchQuote(data.txId, sizeBytes, address);
      }
      setUploadProgress(100);
      setStatus("idle");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Upload failed.");
    }
  }

  async function fetchEstimate(bytes: number) {
    const res = await fetch("/api/pricing/estimate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sizeBytes: bytes }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? "Estimate failed.");
    }
    const data = await res.json();
    setEstimate(data);
  }

  async function fetchQuote(txid: string, bytes: number, user: string) {
    const res = await fetch("/api/pricing/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address: user,
        arTx: txid,
        sizeBytes: bytes,
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? "Quote failed.");
    }
    const data = await res.json();
    setQuote(data);
  }

  async function handleApproveAndPost() {
    setError(null);
    if (!isConnected || !address) {
      setError("Connect your wallet first.");
      return;
    }
    if (!DOC_PAY_GO_ADDRESS || !USDC_ADDRESS) {
      setError("Contract addresses are not configured.");
      return;
    }
    if (!file) {
      setError("Choose a file first.");
      return;
    }
    if (!arTx) {
      setError("Upload to Arweave first.");
      return;
    }
    if (!quote) {
      if (isConnected && address) {
        try {
          await fetchQuote(arTx, sizeBytes, address);
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "Price quote failed."
          );
          return;
        }
      } else {
        setError("Price quote not ready yet.");
        return;
      }
    }

    try {
      setStatus("approving");
      await writeContractAsync({
        address: USDC_ADDRESS as `0x${string}`,
        abi: erc20Abi,
        functionName: "approve",
        args: [DOC_PAY_GO_ADDRESS as `0x${string}`, usdcUnits],
      });

      setStatus("posting");
      const hash = await writeContractAsync({
        address: DOC_PAY_GO_ADDRESS as `0x${string}`,
        abi: docPayGoAbi,
        functionName: "post",
        args: [
          arTx,
          title,
          mime,
          BigInt(sizeBytes),
          BigInt(quote.priceCents),
          BigInt(quote.expiresAt),
          quote.signature,
        ],
      });
      setTxHash(hash);
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Transaction failed.");
    }
  }

  function handleFileSelected(f: File | null) {
    setFile(f);
    setMime(f?.type ?? "");
    setTitle(f?.name ?? "");
    setStatus("idle");
    setTxHash(null);
    setArweaveUrl(null);
    setArTx("");
    setQuote(null);
    setEstimate(null);
    if (f) {
      fetchEstimate(f.size).catch((err) =>
        setError(err instanceof Error ? err.message : "Estimate failed.")
      );
    }
  }

  return (
    <section className="mt-8 max-w-xl space-y-4 rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900">
        Upload + Post (USDC)
      </h2>
      <p className="text-sm text-gray-600">
        This MVP expects you to upload to Arweave separately, then paste the
        Arweave transaction ID here.
      </p>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">File</label>
        <div
          className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-8 text-center text-sm transition ${
            isDragging
              ? "border-indigo-500 bg-indigo-50 text-indigo-700"
              : "border-gray-300 text-gray-600"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            const f = e.dataTransfer.files?.[0] ?? null;
            handleFileSelected(f);
          }}
          onClick={() => {
            const input = document.getElementById("file-input");
            input?.click();
          }}
        >
          <div className="font-medium">
            Drag & drop a file here, or click to browse
          </div>
          <div className="mt-1 text-xs text-gray-500">
            PDF, images, audio, or any document
          </div>
          <div className="mt-1 text-xs text-gray-500">
            <button
              className="font-medium text-indigo-600 underline"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowFileTypes(true);
              }}
            >
              Supported file types
            </button>
          </div>
          {devMode !== null && (
            <div className="mt-2 text-xs text-gray-500">
              Mode:{" "}
              <span className="font-medium">
                {devMode ? "Dev (ArLocal)" : "Live (Arweave)"}
              </span>
            </div>
          )}
          <div className="mt-2 text-xs text-amber-700">
            Safety check: executable files are blocked and uploads are scanned.
          </div>
        </div>
        <input
          id="file-input"
          type="file"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            handleFileSelected(f);
          }}
        />
        {file && (
          <div className="text-xs text-gray-600">
            {file.name} • {(file.size / 1_000_000).toFixed(2)} MB
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3">
        <input
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          placeholder="Arweave TXID (auto-filled)"
          value={arTx}
          readOnly
        />
        <input
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          placeholder="Title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
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
          <div className="text-sm text-gray-600">
            Uploading to Arweave...
          </div>
          <div className="h-2 w-full rounded bg-gray-200">
            <div
              className="h-2 rounded bg-indigo-600 transition-all"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          onClick={handleUploadToArweave}
          disabled={status === "uploading"}
        >
          {status === "uploading" ? "Uploading..." : "Upload to Arweave"}
        </button>
        <button
          className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          onClick={handleApproveAndPost}
          disabled={status === "approving" || status === "posting"}
        >
          {status === "approving"
            ? "Approving USDC..."
            : status === "posting"
            ? "Posting..."
            : "Approve + Post"}
        </button>
      </div>
      <div className="text-xs text-gray-500">
        Flow: upload → price locks → approve & post
        <button
          className="ml-2 inline-flex items-center text-xs font-medium text-indigo-600 underline"
          onClick={() => setShowPricingInfo(true)}
          type="button"
        >
          How pricing works
        </button>
        <button
          className="ml-3 inline-flex items-center text-xs font-medium text-indigo-600 underline"
          onClick={() => setShowSafetyInfo(true)}
          type="button"
        >
          Privacy & safety
        </button>
      </div>

      {showPricingInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-900">
                How pricing works
              </div>
              <button
                className="text-sm text-gray-500"
                onClick={() => setShowPricingInfo(false)}
                type="button"
              >
                Close
              </button>
            </div>
            <div className="mt-3 space-y-2 text-sm text-gray-700">
              <div>
                1. We estimate the price when you select a file.
              </div>
              <div>
                2. After upload, we lock a signed price quote for 30 minutes.
              </div>
              <div>
                3. You approve USDC and post on‑chain with that locked price.
              </div>
            </div>
          </div>
        </div>
      )}

      {showSafetyInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-900">
                Privacy & safety
              </div>
              <button
                className="text-sm text-gray-500"
                onClick={() => setShowSafetyInfo(false)}
                type="button"
              >
                Close
              </button>
            </div>
            <div className="mt-3 space-y-2 text-sm text-gray-700">
              <div>
                Uploads are permanent on the blockchain. We can’t delete them,
                but we can hide content from our platform if it violates the
                rules.
              </div>
              <div>
                We do not collect or sell your personal data. Wallets and keys
                are never stored by MintyDoc.
              </div>
              <div>
                We support open, lawful speech and neutral access. We only take
                action on content that is illegal, exploits minors, or poses a
                real risk of harm to people.
              </div>
              <div>
                We remain neutral on beliefs and opinions. Our focus is safety
                and legality—not policing ideas.
              </div>
              <div>
                <a
                  href="/platform-policy"
                  className="font-medium text-indigo-600 underline"
                >
                  Read platform rules
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {showFileTypes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-900">
                Supported file types
              </div>
              <button
                className="text-sm text-gray-500"
                onClick={() => setShowFileTypes(false)}
                type="button"
              >
                Close
              </button>
            </div>
            <div className="mt-3 space-y-2 text-sm text-gray-700">
              <div>Documents: PDF, TXT, MD, DOC, DOCX</div>
              <div>Images: PNG, JPG, GIF, WebP, HEIC/HEIF</div>
              <div>Audio: MP3, WAV</div>
              <div>Video: MP4, MOV</div>
              <div>Archives: ZIP</div>
              <div className="text-xs text-gray-500">
                Executables are blocked for safety.
              </div>
            </div>
          </div>
        </div>
      )}

      {(txHash || arweaveUrl) && (
        <div className="rounded border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          <div className="font-medium text-green-800">Success</div>
          <div className="mt-1 text-green-800">
            Your document is permanent and verifiable.
          </div>
          {arweaveUrl && (
            <div className="mt-2">
              <span className="font-medium">Arweave:</span>{" "}
              <a
                href={arweaveUrl}
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                View on Arweave
              </a>
            </div>
          )}
          {txHash && (
            <div className="mt-1">
              <span className="font-medium">Transaction:</span>{" "}
              <a
                href={`https://amoy.polygonscan.com/tx/${txHash}`}
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                View on Polygonscan
              </a>
            </div>
          )}
        </div>
      )}
      {error && (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {formatError(error)}
        </div>
      )}
    </section>
  );
}

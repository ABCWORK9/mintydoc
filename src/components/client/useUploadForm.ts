import { useEffect, useMemo, useState } from "react";
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

export default function useUploadForm(options?: { pricingExtraBytes?: number }) {
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

  const extra = options?.pricingExtraBytes;
  const extraBytes =
    Number.isFinite(extra) && (extra as number) >= 0 ? (extra as number) : 0;
  const sizeBytes = (file?.size ?? 0) + extraBytes;
  const priceCents = quote?.priceCents ?? estimate?.priceCents ?? 0;
  const usdcUnits = useMemo(() => centsToUsdcUnits(priceCents), [priceCents]);
  const priceUsd = useMemo(() => (priceCents / 100).toFixed(2), [priceCents]);

  useEffect(() => {
    if (!file) return;
    fetchEstimate(sizeBytes).catch((err) =>
      setError(err instanceof Error ? err.message : "Estimate failed.")
    );
  }, [sizeBytes, file]);
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
          setError(err instanceof Error ? err.message : "Price quote failed.");
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
      fetchEstimate(sizeBytes).catch((err) =>
        setError(err instanceof Error ? err.message : "Estimate failed.")
      );
    }
  }

  return {
    address,
    isConnected,
    file,
    arTx,
    title,
    mime,
    status,
    error,
    txHash,
    arweaveUrl,
    isDragging,
    uploadProgress,
    quote,
    showPricingInfo,
    showSafetyInfo,
    devMode,
    showFileTypes,
    estimate,
    sizeBytes,
    priceCents,
    usdcUnits,
    priceUsd,
    breakdown,
    formatError,
    setFile,
    setArTx,
    setTitle,
    setMime,
    setStatus,
    setError,
    setTxHash,
    setArweaveUrl,
    setIsDragging,
    setUploadProgress,
    setQuote,
    setShowPricingInfo,
    setShowSafetyInfo,
    setDevMode,
    setShowFileTypes,
    setEstimate,
    handleUploadToArweave,
    handleApproveAndPost,
    handleFileSelected,
  };
}

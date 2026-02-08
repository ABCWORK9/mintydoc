/*
UI sections: upload area, pricing review, actions, modals (pricing, safety, file types), success/error states.
Behavior checkpoints: selecting a file updates metadata/pricing; upload triggers Arweave flow; approve+post triggers on-chain flow; errors/success render unchanged.
*/

"use client";

import React from "react";
import useUploadForm from "@/components/client/useUploadForm";
import UploadPanel from "@/components/publishing/UploadPanel";
import ReviewPanel from "@/components/publishing/ReviewPanel";
import ActionsPanel from "@/components/publishing/ActionsPanel";
import { platformCopy } from "@/lib/copy/platform";
import MetaBlock from "@/components/docs/MetaBlock";
import MetaRow from "@/components/docs/MetaRow";
import ProofBlock from "@/components/docs/ProofBlock";
import { getExplorerTxUrl } from "@/lib/chain";

export default function UploadForm() {
  const {
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
  } = useUploadForm();

  return (
    <section className="mt-8 max-w-xl space-y-4 rounded-lg border border-gray-200 p-6">
      <UploadPanel
        isDragging={isDragging}
        setIsDragging={setIsDragging}
        handleFileSelected={handleFileSelected}
        file={file}
        devMode={devMode}
        setShowFileTypes={setShowFileTypes}
      />

      <ReviewPanel
        arTx={arTx}
        title={title}
        setTitle={setTitle}
        mime={mime}
        setMime={setMime}
        breakdown={breakdown}
        priceUsd={priceUsd}
        priceCents={priceCents}
        usdcUnits={usdcUnits}
        quote={quote}
        status={status}
        uploadProgress={uploadProgress}
      />

      <ActionsPanel
        status={status}
        handleUploadToArweave={handleUploadToArweave}
        handleApproveAndPost={handleApproveAndPost}
        setShowPricingInfo={setShowPricingInfo}
        setShowSafetyInfo={setShowSafetyInfo}
      />

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
                  {platformCopy.policy.rulesLinkLabel}
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
                {platformCopy.uploads.supportedTypesTitle}
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
                {platformCopy.uploads.executablesBlocked}
              </div>
            </div>
          </div>
        </div>
      )}

      {(txHash || arweaveUrl) && (
        <div className="rounded border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          <div className="font-medium text-green-800">Success</div>
          <div className="mt-1 text-green-800">
            {platformCopy.permanence.successLine}
          </div>
          <MetaBlock>
            {title ? <MetaRow label="Title">{title}</MetaRow> : null}
            {mime ? <MetaRow label="MIME">{mime}</MetaRow> : null}
            {typeof sizeBytes === "number" ? (
              <MetaRow label="Size">{sizeBytes} bytes</MetaRow>
            ) : null}
            {address ? <MetaRow label="Owner">{address}</MetaRow> : null}
          </MetaBlock>
          <ProofBlock
            rows={[
              {
                label: "Arweave",
                value: arweaveUrl ?? arTx,
              },
              {
                label: "Transaction",
                value: txHash ?? "",
              },
            ]}
          />
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
                href={getExplorerTxUrl(txHash)}
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


import React from "react";
import Button from "@/components/ui/Button";


type ActionsPanelProps = {
  status: string;
  handleUploadToArweave: () => void;
  handleApproveAndPost: () => void;
  setShowPricingInfo: (value: boolean) => void;
  setShowSafetyInfo: (value: boolean) => void;
};

export default function ActionsPanel({
  status,
  handleUploadToArweave,
  handleApproveAndPost,
  setShowPricingInfo,
  setShowSafetyInfo,
}: ActionsPanelProps) {
  return (
    <>
      <div className="flex flex-wrap gap-3">
        <Button
          className="border-0 bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          onClick={handleUploadToArweave}
          disabled={status === "uploading"}
        >
          {status === "uploading" ? "Uploading..." : "Upload to Arweave"}
        </Button>
        <Button
          className="border-0 bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          onClick={handleApproveAndPost}
          disabled={status === "approving" || status === "posting"}
        >
          {status === "approving"
            ? "Approving USDC..."
            : status === "posting"
            ? "Posting..."
            : "Approve + Post"}
        </Button>
      </div>
      <div className="text-xs text-gray-500">
        Flow: upload → price locks → approve & post
        <Button
          className="ml-2 inline-flex items-center border-0 bg-transparent p-0 text-xs font-medium text-indigo-600 underline"
          onClick={() => setShowPricingInfo(true)}
          type="button"
        >
          How pricing works
        </Button>
        <Button
          className="ml-3 inline-flex items-center border-0 bg-transparent p-0 text-xs font-medium text-indigo-600 underline"
          onClick={() => setShowSafetyInfo(true)}
          type="button"
        >
          Privacy & safety
        </Button>
      </div>
    </>
  );
}

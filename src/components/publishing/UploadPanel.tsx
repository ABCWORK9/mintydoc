import React from "react";
import Title from "@/components/typography/Title";
import Text from "@/components/typography/Text";
import Meta from "@/components/typography/Meta";
import Button from "@/components/ui/Button";
import { platformCopy } from "@/lib/copy/platform";


type UploadPanelProps = {
  isDragging: boolean;
  setIsDragging: (value: boolean) => void;
  handleFileSelected: (f: File | null) => void;
  file: File | null;
  devMode: boolean | null;
  setShowFileTypes: (value: boolean) => void;
};

export default function UploadPanel({
  isDragging,
  setIsDragging,
  handleFileSelected,
  file,
  devMode,
  setShowFileTypes,
}: UploadPanelProps) {
  return (
    <>
      <Title level="h2" className="text-lg font-semibold text-gray-900">
        Upload + Post (USDC)
      </Title>
      <Text className="text-sm text-gray-600">
        Select a file to prepare for publishing. We’ll upload it to Arweave and
        calculate pricing before you publish.
      </Text>
      <Text className="text-sm text-gray-600">
        Uploads support files up to 12 MB.
      </Text>

      <div className="space-y-2">
        <Meta className="text-sm font-medium text-gray-700">File</Meta>
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
            <Button
              className="border-0 bg-transparent p-0 font-medium text-indigo-600 underline"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowFileTypes(true);
              }}
            >
              {platformCopy.uploads.supportedTypesTitle}
            </Button>
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
    </>
  );
}

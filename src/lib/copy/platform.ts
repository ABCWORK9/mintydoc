export const platformCopy = {
  publish: {
    header: "Post a file permanently on-chain.",
  },
  permanence: {
    modalNotice:
      "Uploads are permanent on the blockchain. We can’t delete them, but we can hide content from our platform if it violates the rules.",
    successLine: "Your file is permanent and verifiable.",
  },
  success: {
    title: "Success",
    arweaveLinkLabel: "Arweave: View on Arweave",
    txLinkLabel: "Transaction: View on Polygonscan",
  },
  policy: {
    rulesLinkLabel: "Read platform rules",
  },
  neutralStance: {
    line1:
      "We support open, lawful speech and neutral access. We only take action on content that is illegal, exploits minors, or poses a real risk of harm to people.",
    line2:
      "We remain neutral on beliefs and opinions. Our focus is safety and legality—not policing ideas.",
  },
  uploads: {
    supportedTypesTitle: "Supported file types",
    executablesBlocked: "Executables are blocked for safety.",
    categories: [
      { label: "Documents", value: "PDF, TXT, MD, DOC, DOCX" },
      { label: "Images", value: "PNG, JPG, GIF, WebP, HEIC/HEIF" },
      { label: "Audio", value: "MP3, WAV" },
      { label: "Video", value: "MP4, MOV" },
      { label: "Archives", value: "ZIP" },
    ],
  },
} as const;

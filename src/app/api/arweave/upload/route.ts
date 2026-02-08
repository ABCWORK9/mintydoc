import { NextResponse } from "next/server";
import Arweave from "arweave";
import type { JWKInterface } from "arweave/node/lib/wallet";
import { randomUUID } from "crypto";
import { execFile } from "child_process";
import { promisify } from "util";
import { writeFile, unlink } from "fs/promises";
import path from "path";

let cachedWallet: JWKInterface | null = null;
let devFundsMinted = false;
const execFileAsync = promisify(execFile);

const ALLOWED_MIME = new Set([
  "application/pdf",
  "text/plain",
  "text/markdown",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/heic",
  "image/heif",
  "audio/mpeg",
  "audio/wav",
  "audio/x-wav",
  "video/mp4",
  "video/quicktime",
  "application/zip",
  "application/x-zip-compressed",
]);

const BLOCKED_EXT = new Set([
  ".exe",
  ".dll",
  ".bat",
  ".cmd",
  ".sh",
  ".ps1",
  ".apk",
  ".msi",
  ".jar",
  ".com",
  ".scr",
]);

async function scanWithClamAV(filePath: string) {
  const enabled = process.env.CLAMAV_ENABLED === "true";
  if (!enabled) return;
  const binary =
    process.env.CLAMAV_PATH ??
    "/opt/homebrew/bin/clamscan";
  try {
    await execFileAsync(binary, ["--no-summary", filePath]);
  } catch (err) {
    const code =
      typeof err === "object" && err && "code" in err
        ? (err as { code?: number }).code
        : undefined;
    if (code === 1) {
      throw new Error("Malware detected. Upload blocked.");
    }
    throw new Error("Virus scan failed. Try again later.");
  }
}

function getArweave() {
  const url = process.env.ARWEAVE_NODE_URL ?? "http://localhost:1984";
  const { protocol, hostname, port } = new URL(url);
  return Arweave.init({
    host: hostname,
    port: port ? Number(port) : protocol === "https:" ? 443 : 80,
    protocol: protocol.replace(":", ""),
  });
}

async function getWallet(arweave: Arweave): Promise<JWKInterface> {
  const b64 = process.env.ARWEAVE_WALLET_JSON_B64;
  if (b64) {
    const json = Buffer.from(b64, "base64").toString("utf-8");
    return JSON.parse(json);
  }

  if (!cachedWallet) {
    cachedWallet = await arweave.wallets.generate();
  }
  return cachedWallet;
}

async function ensureDevFunds(arweave: Arweave, wallet: JWKInterface) {
  if (process.env.ARWEAVE_WALLET_JSON_B64) return;
  if (devFundsMinted) return;
  const addr = await arweave.wallets.getAddress(wallet);
  const baseUrl = process.env.ARWEAVE_NODE_URL ?? "http://localhost:1984";
  const mintUrl = `${baseUrl.replace(/\/$/, "")}/mint/${addr}/1000000000000`;
  await fetch(mintUrl, { method: "GET" });
  devFundsMinted = true;
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    const category = form.get("category");
    const entryType = form.get("entryType");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Missing file" },
        { status: 400 }
      );
    }
    const ext = path.extname(file.name || "").toLowerCase();
    if (BLOCKED_EXT.has(ext)) {
      return NextResponse.json(
        { error: "File type not allowed." },
        { status: 400 }
      );
    }
    if (file.type && !ALLOWED_MIME.has(file.type)) {
      return NextResponse.json(
        { error: "Unsupported file type." },
        { status: 400 }
      );
    }

    const arweave = getArweave();
    const wallet = await getWallet(arweave);
    await ensureDevFunds(arweave, wallet);

    const bytes = Buffer.from(await file.arrayBuffer());
    const tmpPath = path.join("/tmp", `mintydoc-${randomUUID()}`);
    await writeFile(tmpPath, bytes);
    console.log("Arweave upload: scanning file", { name: file.name, size: bytes.length });
    try {
      await scanWithClamAV(tmpPath);
    } finally {
      await unlink(tmpPath).catch(() => undefined);
    }
    console.log("Arweave upload: scan passed");
    const tx = await arweave.createTransaction({ data: bytes }, wallet);
    if (file.type) {
      tx.addTag("Content-Type", file.type);
    }
    if (category === "news") {
      tx.addTag("Minty-Category", "news");
    }
    if (
      entryType === "primary" ||
      entryType === "secondary" ||
      entryType === "commentary"
    ) {
      tx.addTag("Minty-EntryType", entryType);
    }

    await arweave.transactions.sign(tx, wallet);
    const res = await arweave.transactions.post(tx);
    console.log("Arweave upload: post status", res.status);

    if (res.status >= 400) {
      return NextResponse.json(
        { error: "Arweave upload failed", status: res.status },
        { status: 500 }
      );
    }

    const gateway = process.env.ARWEAVE_GATEWAY_URL ?? "https://arweave.net";
    const devMode = !process.env.ARWEAVE_WALLET_JSON_B64;
    return NextResponse.json({
      txId: tx.id,
      url: `${gateway}/${tx.id}`,
      devMode,
    });
  } catch (err) {
    console.error("Arweave upload error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { getJobById } from "@/server/db/publishJobs";
type IntentBody = {
  jobId: string;
};

export async function POST(req: Request) {
  try {
    let body: IntentBody;
    try {
      body = (await req.json()) as IntentBody;
    } catch {
      return NextResponse.json({ error: "invalid_json" }, { status: 400 });
    }

    const jobId = body?.jobId?.trim();
    if (!jobId) {
      return NextResponse.json({ error: "invalid_jobId" }, { status: 400 });
    }

    const job = await getJobById(jobId);
    if (!job) {
      return NextResponse.json({ error: "job_not_found" }, { status: 404 });
    }

    if (job.uploadStatus !== "uploaded" || job.state !== "awaiting_payment") {
      return NextResponse.json(
        { error: "job_not_ready_for_reserve" },
        { status: 409 }
      );
    }

    if (!job.sha256 || !job.sizeBytes) {
      return NextResponse.json(
        { error: "server_inconsistent_state" },
        { status: 500 }
      );
    }

    const chainId = Number(process.env.CHAIN_ID ?? 0);
    const contractAddress = process.env.DOC_PAY_GO_ADDRESS;
    if (!chainId || !contractAddress) {
      return NextResponse.json(
        { error: "server_misconfigured" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "reserve_args_unavailable" },
      { status: 409 }
    );
  } catch {
    return NextResponse.json({ error: "intent_failed" }, { status: 500 });
  }
}

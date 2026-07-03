import { NextResponse } from "next/server";
import { rejectCrossOrigin, rejectIfRateLimited } from "@/lib/auth/request";
import { destroySession } from "@/lib/auth/session";

export async function POST(request: Request) {
  const originError = rejectCrossOrigin(request);
  if (originError) return originError;
  const rateLimitError = rejectIfRateLimited(request, "logout");
  if (rateLimitError) return rateLimitError;

  await destroySession();
  return NextResponse.json({ ok: true });
}

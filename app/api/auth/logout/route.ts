import { NextResponse } from "next/server";
import { rejectCrossOrigin } from "@/lib/auth/request";
import { destroySession } from "@/lib/auth/session";

export async function POST(request: Request) {
  const originError = rejectCrossOrigin(request);
  if (originError) return originError;

  await destroySession();
  return NextResponse.json({ ok: true });
}

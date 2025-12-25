import { NextResponse } from "next/server";
import { clearAuthCookie } from "@/lib/auth";
import { isSameOrigin } from "@/lib/csrf";

export async function POST(req: Request) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Requête refusée" }, { status: 403 });
  }

  await clearAuthCookie();
  return NextResponse.json({ ok: true });
}



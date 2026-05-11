import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isAdminAuthEnabled, isAuthenticatedFromCookies } from "@/lib/auth";
import { readRuns } from "@/lib/store";

export async function GET() {
  if (isAdminAuthEnabled() && !isAuthenticatedFromCookies(cookies())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const runs = await readRuns();
  return NextResponse.json({ runs });
}

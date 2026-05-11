import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isAdminAuthEnabled, isAuthenticatedFromCookies } from "@/lib/auth";
import { analyzeKeywordOpportunities } from "@/lib/discovery";

export async function POST(request) {
  if (isAdminAuthEnabled() && !isAuthenticatedFromCookies(cookies())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json();
  const queries = Array.isArray(body.queries) ? body.queries : [];

  if (queries.length === 0) {
    return NextResponse.json({ error: "Provide at least one keyword query." }, { status: 400 });
  }

  const opportunities = analyzeKeywordOpportunities(queries);
  return NextResponse.json({ opportunities });
}

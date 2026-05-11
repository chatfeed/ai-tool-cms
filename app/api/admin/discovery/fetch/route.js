import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isAdminAuthEnabled, isAuthenticatedFromCookies } from "@/lib/auth";
import { fetchDiscoverySignals } from "@/lib/discovery-sources";
import { readKeywords, readRuns } from "@/lib/store";

export async function POST(request) {
  if (isAdminAuthEnabled() && !isAuthenticatedFromCookies(cookies())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json();
  const provider = String(body.provider || "internal_seed");
  const geo = String(body.geo || "US");

  const keywords = await readKeywords();
  const runs = await readRuns();
  try {
    const result = await fetchDiscoverySignals({
      geo,
      allowFallback: provider !== "google_trends_free",
      provider,
      keywords,
      toolRuns: runs
    });

    return NextResponse.json({
      providerRequested: provider,
      providerUsed: result.providerUsed,
      warning: result.warning,
      geo,
      queries: result.queries
    });
  } catch (error) {
    return NextResponse.json({
      error: `Failed to fetch ${provider}: ${error.message}`
    }, { status: 502 });
  }
}

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isAdminAuthEnabled, isAuthenticatedFromCookies } from "@/lib/auth";
import { readKeywords, validateKeywords, writeKeywords } from "@/lib/store";

export async function GET() {
  if (!isAllowed()) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const keywords = await readKeywords();
  return NextResponse.json({ keywords });
}

export async function PUT(request) {
  if (!isAllowed()) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json();
  const validationError = validateKeywords(body.keywords);

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  await writeKeywords(body.keywords);
  return NextResponse.json({ ok: true });
}

function isAllowed() {
  return !isAdminAuthEnabled() || isAuthenticatedFromCookies(cookies());
}

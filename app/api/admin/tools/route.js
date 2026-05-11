import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isAdminAuthEnabled, isAuthenticatedFromCookies } from "@/lib/auth";
import { readTools, validateTools, writeTools } from "@/lib/store";

export async function GET() {
  if (!isAllowed()) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const tools = await readTools();
  return NextResponse.json({ tools });
}

export async function PUT(request) {
  if (!isAllowed()) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json();
  const validationError = validateTools(body.tools);

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  await writeTools(body.tools);
  return NextResponse.json({ ok: true });
}

function isAllowed() {
  return !isAdminAuthEnabled() || isAuthenticatedFromCookies(cookies());
}

import { NextResponse } from "next/server";
import { clearAdminCookie } from "@/lib/auth";

export async function POST(request) {
  const response = NextResponse.redirect(new URL("/admin/login", request.url), { status: 303 });
  clearAdminCookie(response);
  return response;
}

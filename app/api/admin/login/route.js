import { NextResponse } from "next/server";
import { setAdminCookie, verifyAdminPassword } from "@/lib/auth";

export async function POST(request) {
  const formData = await request.formData();
  const password = String(formData.get("password") || "");
  const next = sanitizeNextPath(String(formData.get("next") || "/admin"));

  if (!verifyAdminPassword(password)) {
    return NextResponse.redirect(new URL(`/admin/login?error=1&next=${encodeURIComponent(next)}`, request.url), {
      status: 303
    });
  }

  const response = NextResponse.redirect(new URL(next, request.url), { status: 303 });
  setAdminCookie(response);
  return response;
}

function sanitizeNextPath(value) {
  if (!value.startsWith("/") || value.startsWith("//")) {
    return "/admin";
  }
  return value;
}

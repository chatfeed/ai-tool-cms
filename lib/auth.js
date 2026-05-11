import crypto from "crypto";

const cookieName = "toolforge_admin";
const maxAgeSeconds = 60 * 60 * 24 * 7;

export function isAdminAuthEnabled() {
  return Boolean(process.env.ADMIN_PASSWORD);
}

export function verifyAdminPassword(password) {
  return isAdminAuthEnabled() && password === process.env.ADMIN_PASSWORD;
}

export function createAdminSessionToken() {
  const issuedAt = Date.now().toString();
  const signature = signValue(issuedAt);
  return `${issuedAt}.${signature}`;
}

export function isValidAdminSession(token) {
  if (!isAdminAuthEnabled()) {
    return true;
  }

  if (!token || !token.includes(".")) {
    return false;
  }

  const [issuedAt, signature] = token.split(".");
  const ageMs = Date.now() - Number(issuedAt);

  if (!Number.isFinite(ageMs) || ageMs < 0 || ageMs > maxAgeSeconds * 1000) {
    return false;
  }

  return signature === signValue(issuedAt);
}

export function isAuthenticatedFromCookies(cookieStore) {
  return isValidAdminSession(cookieStore.get(cookieName)?.value);
}

export function setAdminCookie(response) {
  response.cookies.set(cookieName, createAdminSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSeconds
  });
}

export function clearAdminCookie(response) {
  response.cookies.set(cookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
}

export function getAdminCookieName() {
  return cookieName;
}

function signValue(value) {
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || "toolforge-dev-secret";
  return crypto.createHmac("sha256", secret).update(value).digest("base64url");
}

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { LockKeyhole } from "lucide-react";
import { isAdminAuthEnabled, isAuthenticatedFromCookies } from "@/lib/auth";

export const metadata = {
  title: "Admin Login | ToolForge AI",
  description: "Sign in to manage AI tool pages."
};

export default function AdminLoginPage({ searchParams }) {
  if (!isAdminAuthEnabled() || isAuthenticatedFromCookies(cookies())) {
    redirect("/admin");
  }

  const next = searchParams?.next || "/admin";
  const error = searchParams?.error;

  return (
    <main className="page auth-page">
      <section className="panel pad auth-card">
        <span className="brand-mark">
          <LockKeyhole size={18} />
        </span>
        <p className="eyebrow">Admin access</p>
        <h1 className="auth-title">Sign in to ToolForge AI</h1>
        <form className="form-grid" action="/api/admin/login" method="post">
          <input type="hidden" name="next" value={next} />
          <label className="field">
            <span>Password</span>
            <input className="input" type="password" name="password" autoComplete="current-password" required autoFocus />
          </label>
          {error ? <p className="error">The password was not correct.</p> : null}
          <button className="btn primary" type="submit">Sign in</button>
        </form>
      </section>
    </main>
  );
}

import AdminEditor from "./AdminEditor";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { isAdminAuthEnabled, isAuthenticatedFromCookies } from "@/lib/auth";
import { readRuns, readTools } from "@/lib/store";

export const metadata = {
  title: "Admin | ToolForge AI",
  description: "Manage configurable AI tool pages."
};

export default async function AdminPage() {
  if (isAdminAuthEnabled() && !isAuthenticatedFromCookies(cookies())) {
    redirect("/admin/login");
  }

  const tools = await readTools();
  const runs = await readRuns();

  return (
    <main className="page">
      <AdminEditor
        authEnabled={isAdminAuthEnabled()}
        initialTools={tools}
        initialRuns={runs}
      />
    </main>
  );
}

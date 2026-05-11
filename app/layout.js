import "./globals.css";
import Link from "next/link";
import { Sparkles } from "lucide-react";

export const metadata = {
  title: "ToolForge AI",
  description: "SEO-first AI tool page CMS for configurable form-to-result workflows."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="shell">
          <header className="topbar">
            <Link className="brand" href="/">
              <span className="brand-mark">
                <Sparkles size={18} />
              </span>
              <span>ToolForge AI</span>
            </Link>
            <nav className="nav" aria-label="Primary navigation">
              <Link href="/tools">Tools</Link>
              <Link href="/admin">Admin</Link>
              <Link href="/sitemap.xml">Sitemap</Link>
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}

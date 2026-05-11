import "./globals.css";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { getDictionary } from "@/lib/i18n";

export const metadata = {
  title: "ToolForge AI",
  description: "SEO-first AI tool page CMS for configurable form-to-result workflows."
};

export default function RootLayout({ children }) {
  const t = getDictionary("en");

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
              <Link href="/tools">{t.navTools}</Link>
              <Link href="/admin">{t.navAdmin}</Link>
              <Link href="/sitemap.xml">{t.navSitemap}</Link>
              <Link href="/en">EN</Link>
              <Link href="/zh">中文</Link>
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}

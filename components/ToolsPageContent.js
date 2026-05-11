import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getDictionary, localizedPath } from "@/lib/i18n";

export default function ToolsPageContent({ locale = "en", tools }) {
  const t = getDictionary(locale);

  return (
    <main className="page">
      <p className="eyebrow">{t.publishedTools}</p>
      <h1>{t.toolsTitle}</h1>
      <p className="lede">{t.toolsLead}</p>
      <section className="grid content-section">
        {tools.map((tool) => (
          <Link className="tool-card" href={localizedPath(`/${tool.slug}`, locale)} key={tool.id}>
            <div>
              <div className="tag-row">
                <span className="tag">{tool.category}</span>
              </div>
              <h2>{tool.name}</h2>
              <p>{tool.description}</p>
            </div>
            <span className="btn ghost">
              {t.tryTool} <ArrowRight size={17} />
            </span>
          </Link>
        ))}
      </section>
    </main>
  );
}

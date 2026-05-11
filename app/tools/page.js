import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getPublishedTools } from "@/lib/store";

export const metadata = {
  title: "AI Tools | ToolForge AI",
  description: "Browse published AI tools generated from configurable forms, prompts, and SEO content."
};

export default async function ToolsPage() {
  const tools = await getPublishedTools();

  return (
    <main className="page">
      <p className="eyebrow">Published tool pages</p>
      <h1>AI tools built from reusable page configuration.</h1>
      <p className="lede">Each tool route is generated from the same schema: metadata, form fields, prompt template, result display, and SEO content.</p>
      <section className="grid content-section">
        {tools.map((tool) => (
          <Link className="tool-card" href={`/${tool.slug}`} key={tool.id}>
            <div>
              <div className="tag-row">
                <span className="tag">{tool.category}</span>
              </div>
              <h2>{tool.name}</h2>
              <p>{tool.description}</p>
            </div>
            <span className="btn ghost">
              Try tool <ArrowRight size={17} />
            </span>
          </Link>
        ))}
      </section>
    </main>
  );
}

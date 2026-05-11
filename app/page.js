import Link from "next/link";
import { ArrowRight, Gauge, Layers3, Search } from "lucide-react";
import { getPublishedTools } from "@/lib/store";

export default async function HomePage() {
  const tools = await getPublishedTools();

  return (
    <main className="page">
      <section className="hero">
        <div>
          <p className="eyebrow">SEO-first AI tool CMS</p>
          <h1>Launch configurable AI tool pages that search engines can understand.</h1>
          <p className="lede">
            ToolForge AI turns a repeatable workflow into a reusable publishing system:
            define a form, bind it to a prompt, add search content, and publish a real tool page.
          </p>
          <div className="actions">
            <Link className="btn primary" href="/admin">
              Open admin <ArrowRight size={17} />
            </Link>
            <Link className="btn" href="/tools">Browse tools</Link>
          </div>
        </div>
        <div className="panel pad">
          <div className="stats">
            <div className="stat">
              <strong>{tools.length}</strong>
              <span>Published tools</span>
            </div>
            <div className="stat">
              <strong>1</strong>
              <span>Shared execution engine</span>
            </div>
            <div className="stat">
              <strong>SEO</strong>
              <span>Metadata and sitemap ready</span>
            </div>
          </div>
          <div className="content-section">
            <h2>Built around the real pattern</h2>
            <div className="two-col">
              <Feature icon={<Layers3 size={19} />} title="Configurable tools" text="Fields, prompts, result formats, and SEO blocks are all maintained as page configuration." />
              <Feature icon={<Search size={19} />} title="Indexable pages" text="Each tool has its own route, title, description, FAQ schema, and sitemap entry." />
              <Feature icon={<Gauge size={19} />} title="Fast MVP path" text="Local JSON storage keeps the prototype simple while preserving a clean upgrade path to a database." />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function Feature({ icon, title, text }) {
  return (
    <div>
      <div className="tag-row">
        <span className="tag">{icon}</span>
      </div>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

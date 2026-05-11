import Link from "next/link";
import { ArrowRight, Gauge, Layers3, Search } from "lucide-react";
import { getDictionary, localizedPath } from "@/lib/i18n";

export default function HomePageContent({ locale = "en", tools }) {
  const t = getDictionary(locale);

  return (
    <main className="page">
      <section className="hero">
        <div>
          <p className="eyebrow">{t.heroEyebrow}</p>
          <h1>{t.heroTitle}</h1>
          <p className="lede">{t.heroLead}</p>
          <div className="actions">
            <Link className="btn primary" href="/admin">
              {t.openAdmin} <ArrowRight size={17} />
            </Link>
            <Link className="btn" href={localizedPath("/tools", locale)}>{t.browseTools}</Link>
          </div>
        </div>
        <div className="panel pad">
          <div className="stats">
            <div className="stat">
              <strong>{tools.length}</strong>
              <span>{t.publishedTools}</span>
            </div>
            <div className="stat">
              <strong>1</strong>
              <span>{t.sharedEngine}</span>
            </div>
            <div className="stat">
              <strong>SEO</strong>
              <span>{t.metadataReady}</span>
            </div>
          </div>
          <div className="content-section">
            <h2>{t.realPattern}</h2>
            <div className="two-col">
              <Feature icon={<Layers3 size={19} />} title={t.configurableTools} text={t.configurableToolsText} />
              <Feature icon={<Search size={19} />} title={t.indexablePages} text={t.indexablePagesText} />
              <Feature icon={<Gauge size={19} />} title={t.fastMvp} text={t.fastMvpText} />
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

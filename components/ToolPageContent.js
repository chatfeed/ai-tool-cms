import Link from "next/link";
import { EyeOff } from "lucide-react";
import ToolRunner from "@/app/[slug]/ToolRunner";
import { getDictionary, localizedPath } from "@/lib/i18n";

export default function ToolPageContent({ isPreview, locale = "en", relatedTools, tool }) {
  const t = getDictionary(locale);

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": tool.seo.faqs.map((item) => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer
      }
    }))
  };

  return (
    <main className="page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <p className="eyebrow">{tool.category}</p>
      {isPreview && tool.status !== "published" ? (
        <p className="notice">
          <EyeOff size={16} style={{ verticalAlign: "text-bottom", marginRight: 6 }} />
          {t.draftPreview}
        </p>
      ) : null}
      <h1>{tool.h1}</h1>
      <p className="lede">{tool.intro}</p>

      <section className="content-section">
        <ToolRunner locale={locale} tool={tool} preview={isPreview} />
      </section>

      <section className="content-section two-col">
        <div>
          <h2>{t.howToUse}</h2>
          <ol>
            {tool.seo.steps.map((step) => <li key={step}>{step}</li>)}
          </ol>
        </div>
        <div>
          <h2>{t.useCases}</h2>
          <ul>
            {tool.seo.useCases.map((useCase) => <li key={useCase}>{useCase}</li>)}
          </ul>
        </div>
      </section>

      <section className="content-section">
        <h2>{t.faq}</h2>
        {tool.seo.faqs.map((item) => (
          <div className="faq-item" key={item.question}>
            <h3>{item.question}</h3>
            <p>{item.answer}</p>
          </div>
        ))}
      </section>

      {relatedTools.length > 0 ? (
        <section className="content-section">
          <h2>{t.relatedTools}</h2>
          <div className="grid">
            {relatedTools.map((relatedTool) => (
              <Link className="tool-card" href={localizedPath(`/${relatedTool.slug}`, locale)} key={relatedTool.id}>
                <div>
                  <div className="tag-row">
                    <span className="tag">{relatedTool.category}</span>
                  </div>
                  <h3>{relatedTool.name}</h3>
                  <p>{relatedTool.description}</p>
                </div>
                <span className="btn ghost">{t.openTool}</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}

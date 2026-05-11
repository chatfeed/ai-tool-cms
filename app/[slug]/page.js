import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { EyeOff } from "lucide-react";
import { isAdminAuthEnabled, isAuthenticatedFromCookies } from "@/lib/auth";
import { getPublishedTools, getToolBySlug } from "@/lib/store";
import ToolRunner from "./ToolRunner";

export async function generateStaticParams() {
  const tools = await getPublishedTools();
  return tools.map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({ params }) {
  const tool = await getToolBySlug(params.slug);

  if (!tool || tool.status !== "published") {
    return {};
  }

  return {
    title: tool.title,
    description: tool.description,
    alternates: {
      canonical: `/${tool.slug}`
    }
  };
}

export default async function ToolPage({ params, searchParams }) {
  const tool = await getToolBySlug(params.slug);
  const isPreview = searchParams?.preview === "1";
  const canPreview = !isAdminAuthEnabled() || isAuthenticatedFromCookies(cookies());

  if (!tool || (tool.status !== "published" && (!isPreview || !canPreview))) {
    notFound();
  }

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
          Draft preview. This page is hidden from public tool lists and sitemap until published.
        </p>
      ) : null}
      <h1>{tool.h1}</h1>
      <p className="lede">{tool.intro}</p>

      <section className="content-section">
        <ToolRunner tool={tool} preview={isPreview} />
      </section>

      <section className="content-section two-col">
        <div>
          <h2>How to use this tool</h2>
          <ol>
            {tool.seo.steps.map((step) => <li key={step}>{step}</li>)}
          </ol>
        </div>
        <div>
          <h2>Use cases</h2>
          <ul>
            {tool.seo.useCases.map((useCase) => <li key={useCase}>{useCase}</li>)}
          </ul>
        </div>
      </section>

      <section className="content-section">
        <h2>Frequently asked questions</h2>
        {tool.seo.faqs.map((item) => (
          <div className="faq-item" key={item.question}>
            <h3>{item.question}</h3>
            <p>{item.answer}</p>
          </div>
        ))}
      </section>
    </main>
  );
}

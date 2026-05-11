import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import ToolPageContent from "@/components/ToolPageContent";
import { isAdminAuthEnabled, isAuthenticatedFromCookies } from "@/lib/auth";
import { suggestRelatedTools } from "@/lib/growth";
import { getPublishedTools, getToolBySlug, readKeywords } from "@/lib/store";

export async function generateStaticParams() {
  const tools = await getPublishedTools();
  return tools.map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({ params }) {
  const tool = await getToolBySlug(params.slug);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  if (!tool || tool.status !== "published") {
    return {};
  }

  return {
    title: tool.title,
    description: tool.description,
    alternates: {
      canonical: `${baseUrl}/zh/${tool.slug}`,
      languages: {
        en: `${baseUrl}/en/${tool.slug}`,
        zh: `${baseUrl}/zh/${tool.slug}`
      }
    },
    openGraph: {
      title: tool.title,
      description: tool.description,
      url: `${baseUrl}/zh/${tool.slug}`,
      siteName: "ToolForge AI",
      type: "website"
    },
    twitter: {
      card: "summary",
      title: tool.title,
      description: tool.description
    }
  };
}

export default async function ChineseToolPage({ params, searchParams }) {
  const tool = await getToolBySlug(params.slug);
  const publishedTools = await getPublishedTools();
  const keywords = await readKeywords();
  const isPreview = searchParams?.preview === "1";
  const canPreview = !isAdminAuthEnabled() || isAuthenticatedFromCookies(cookies());

  if (!tool || (tool.status !== "published" && (!isPreview || !canPreview))) {
    notFound();
  }

  const relatedTools = suggestRelatedTools(tool, publishedTools, keywords, 3);
  return <ToolPageContent isPreview={isPreview} locale="zh" relatedTools={relatedTools} tool={tool} />;
}

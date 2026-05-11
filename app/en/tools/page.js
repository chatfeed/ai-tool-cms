import ToolsPageContent from "@/components/ToolsPageContent";
import { getPublishedTools } from "@/lib/store";

export const metadata = {
  title: "AI Tools | ToolForge AI",
  description: "Browse published AI tools generated from configurable forms, prompts, and SEO content."
};

export default async function EnglishToolsPage() {
  const tools = await getPublishedTools();
  return <ToolsPageContent locale="en" tools={tools} />;
}

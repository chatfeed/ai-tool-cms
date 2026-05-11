import HomePageContent from "@/components/HomePageContent";
import { getPublishedTools } from "@/lib/store";

export const metadata = {
  title: "ToolForge AI",
  description: "SEO-first AI tool page CMS for configurable form-to-result workflows."
};

export default async function EnglishHomePage() {
  const tools = await getPublishedTools();
  return <HomePageContent locale="en" tools={tools} />;
}

import HomePageContent from "@/components/HomePageContent";
import { getPublishedTools } from "@/lib/store";

export const metadata = {
  title: "ToolForge AI | AI 工具页面 CMS",
  description: "面向 SEO 增长的 AI 工具页面 CMS。"
};

export default async function ChineseHomePage() {
  const tools = await getPublishedTools();
  return <HomePageContent locale="zh" tools={tools} />;
}

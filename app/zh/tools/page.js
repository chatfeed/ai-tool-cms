import ToolsPageContent from "@/components/ToolsPageContent";
import { getPublishedTools } from "@/lib/store";

export const metadata = {
  title: "AI 工具 | ToolForge AI",
  description: "浏览由表单、Prompt 和 SEO 内容配置生成的 AI 工具页面。"
};

export default async function ChineseToolsPage() {
  const tools = await getPublishedTools();
  return <ToolsPageContent locale="zh" tools={tools} />;
}

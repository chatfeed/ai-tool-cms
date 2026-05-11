export const locales = ["en", "zh"];
export const defaultLocale = "en";

const dictionaries = {
  en: {
    navTools: "Tools",
    navAdmin: "Admin",
    navSitemap: "Sitemap",
    heroEyebrow: "SEO-first AI tool CMS",
    heroTitle: "Launch configurable AI tool pages that search engines can understand.",
    heroLead: "ToolForge AI turns a repeatable workflow into a reusable publishing system: define a form, bind it to a prompt, add search content, and publish a real tool page.",
    openAdmin: "Open admin",
    browseTools: "Browse tools",
    publishedTools: "Published tools",
    sharedEngine: "Shared execution engine",
    metadataReady: "Metadata and sitemap ready",
    realPattern: "Built around the real pattern",
    configurableTools: "Configurable tools",
    configurableToolsText: "Fields, prompts, result formats, and SEO blocks are all maintained as page configuration.",
    indexablePages: "Indexable pages",
    indexablePagesText: "Each tool has its own route, title, description, FAQ schema, and sitemap entry.",
    fastMvp: "Fast MVP path",
    fastMvpText: "SQLite and Prisma keep the prototype simple while preserving a clean upgrade path to PostgreSQL.",
    toolsTitle: "AI tools built from reusable page configuration.",
    toolsLead: "Each tool route is generated from the same schema: metadata, form fields, prompt template, result display, and SEO content.",
    tryTool: "Try tool",
    generateResult: "Generate result",
    generate: "Generate",
    generating: "Generating...",
    result: "Result",
    emptyResult: "Your generated output will appear here.",
    copy: "Copy",
    copied: "Copied",
    selectOption: "Select an option",
    draftPreview: "Draft preview. This page is hidden from public tool lists and sitemap until published.",
    howToUse: "How to use this tool",
    useCases: "Use cases",
    faq: "Frequently asked questions",
    relatedTools: "Related AI tools",
    openTool: "Open tool"
  },
  zh: {
    navTools: "工具",
    navAdmin: "后台",
    navSitemap: "站点地图",
    heroEyebrow: "面向 SEO 的 AI 工具 CMS",
    heroTitle: "快速发布搜索引擎可理解的可配置 AI 工具页。",
    heroLead: "ToolForge AI 把表单、Prompt、SEO 内容和发布流程抽象成一个可复用系统，适合批量运营 AI 工具页面。",
    openAdmin: "打开后台",
    browseTools: "浏览工具",
    publishedTools: "已发布工具",
    sharedEngine: "共享执行引擎",
    metadataReady: "Metadata 与 sitemap 已就绪",
    realPattern: "围绕真实工具站模式构建",
    configurableTools: "可配置工具",
    configurableToolsText: "字段、Prompt、结果格式和 SEO 内容都由页面配置维护。",
    indexablePages: "可收录页面",
    indexablePagesText: "每个工具都有独立路由、标题、描述、FAQ 结构化数据和 sitemap 入口。",
    fastMvp: "快速 MVP 路径",
    fastMvpText: "SQLite 与 Prisma 让原型保持轻量，同时保留升级到 PostgreSQL 的清晰路径。",
    toolsTitle: "由可复用配置生成的 AI 工具页面。",
    toolsLead: "每个工具页都来自同一套 schema：metadata、表单字段、Prompt 模板、结果展示和 SEO 内容。",
    tryTool: "使用工具",
    generateResult: "生成结果",
    generate: "生成",
    generating: "生成中...",
    result: "结果",
    emptyResult: "生成结果会显示在这里。",
    copy: "复制",
    copied: "已复制",
    selectOption: "请选择",
    draftPreview: "草稿预览。发布前该页面不会出现在公开工具列表和 sitemap 中。",
    howToUse: "如何使用",
    useCases: "适用场景",
    faq: "常见问题",
    relatedTools: "相关 AI 工具",
    openTool: "打开工具"
  }
};

export function getDictionary(locale = defaultLocale) {
  return dictionaries[locales.includes(locale) ? locale : defaultLocale];
}

export function localizedPath(path, locale = defaultLocale) {
  if (locale === defaultLocale) {
    return path;
  }

  if (path === "/") {
    return `/${locale}`;
  }

  return `/${locale}${path}`;
}

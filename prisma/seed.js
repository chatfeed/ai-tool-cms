const { PrismaClient } = require("@prisma/client");
const { readFile } = require("fs/promises");
const path = require("path");

const prisma = new PrismaClient();

async function main() {
  const toolsPath = path.join(process.cwd(), "data", "tools.json");
  const runsPath = path.join(process.cwd(), "data", "runs.json");
  const keywordsPath = path.join(process.cwd(), "data", "keywords.json");
  const tools = JSON.parse(await readFile(toolsPath, "utf8"));
  const runs = JSON.parse(await readFile(runsPath, "utf8").catch(() => "[]"));
  const keywords = JSON.parse(await readFile(keywordsPath, "utf8").catch(() => "[]"));

  for (const keyword of keywords) {
    await prisma.keyword.upsert({
      where: { id: keyword.id },
      update: {
        phrase: keyword.phrase,
        category: keyword.category,
        intent: keyword.intent || "tool",
        priority: Number(keyword.priority || 2),
        status: keyword.status || "planned",
        tags: keyword.tags || [],
        notes: keyword.notes || ""
      },
      create: {
        id: keyword.id,
        phrase: keyword.phrase,
        category: keyword.category,
        intent: keyword.intent || "tool",
        priority: Number(keyword.priority || 2),
        status: keyword.status || "planned",
        tags: keyword.tags || [],
        notes: keyword.notes || ""
      }
    });
  }

  for (const tool of tools) {
    await prisma.tool.upsert({
      where: { id: tool.id },
      update: {
        status: tool.status,
        slug: tool.slug,
        name: tool.name,
        category: tool.category,
        title: tool.title,
        description: tool.description,
        h1: tool.h1,
        intro: tool.intro,
        fields: tool.fields,
        prompt: tool.prompt,
        result: tool.result,
        seo: tool.seo,
        sourceKeywordId: tool.sourceKeywordId || null
      },
      create: {
        id: tool.id,
        status: tool.status,
        slug: tool.slug,
        name: tool.name,
        category: tool.category,
        title: tool.title,
        description: tool.description,
        h1: tool.h1,
        intro: tool.intro,
        fields: tool.fields,
        prompt: tool.prompt,
        result: tool.result,
        seo: tool.seo,
        sourceKeywordId: tool.sourceKeywordId || null
      }
    });
  }

  for (const run of runs) {
    const exists = await prisma.toolRun.findUnique({ where: { id: run.id } });
    if (exists) continue;

    const tool = await prisma.tool.findUnique({ where: { id: run.toolId } });
    if (!tool) continue;

    await prisma.toolRun.create({
      data: {
        id: run.id,
        toolId: run.toolId,
        toolSlug: run.toolSlug,
        toolName: run.toolName,
        provider: run.provider,
        values: run.values,
        prompt: run.prompt,
        result: run.result || "",
        error: run.error || null,
        durationMs: run.durationMs || 0,
        createdAt: run.createdAt ? new Date(run.createdAt) : new Date()
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

import { promises as fs } from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";

const dataFile = path.join(process.cwd(), "data", "tools.json");
const runsFile = path.join(process.cwd(), "data", "runs.json");
const keywordsFile = path.join(process.cwd(), "data", "keywords.json");

export async function readTools() {
  if (isDatabaseEnabled()) {
    try {
      const tools = await prisma.tool.findMany({ orderBy: { updatedAt: "desc" } });
      return tools.map(fromDbTool);
    } catch (error) {
      console.warn("Falling back to JSON tools store:", error.message);
    }
  }

  const raw = await fs.readFile(dataFile, "utf8");
  return JSON.parse(raw);
}

export async function writeTools(tools) {
  if (isDatabaseEnabled()) {
    try {
      await prisma.$transaction(async (tx) => {
        const existing = await tx.tool.findMany({ select: { id: true } });
        const nextIds = new Set(tools.map((tool) => tool.id));
        const removedIds = existing.map((tool) => tool.id).filter((id) => !nextIds.has(id));

        if (removedIds.length > 0) {
          await tx.tool.deleteMany({ where: { id: { in: removedIds } } });
        }

        for (const tool of tools) {
          await tx.tool.upsert({
            where: { id: tool.id },
            update: toDbTool(tool),
            create: { id: tool.id, ...toDbTool(tool) }
          });
        }
      });
      return;
    } catch (error) {
      console.warn("Falling back to JSON tools write:", error.message);
    }
  }

  await fs.mkdir(path.dirname(dataFile), { recursive: true });
  await fs.writeFile(dataFile, JSON.stringify(tools, null, 2), "utf8");
}

export async function readRuns() {
  if (isDatabaseEnabled()) {
    try {
      const runs = await prisma.toolRun.findMany({
        orderBy: { createdAt: "desc" },
        take: 200
      });
      return runs.map(fromDbRun);
    } catch (error) {
      console.warn("Falling back to JSON runs store:", error.message);
    }
  }

  try {
    const raw = await fs.readFile(runsFile, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

export async function readKeywords() {
  if (isDatabaseEnabled()) {
    try {
      const keywords = await prisma.keyword.findMany({
        orderBy: [{ priority: "desc" }, { updatedAt: "desc" }]
      });
      return keywords.map(fromDbKeyword);
    } catch (error) {
      console.warn("Falling back to JSON keywords store:", error.message);
    }
  }

  try {
    const raw = await fs.readFile(keywordsFile, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

export async function writeKeywords(keywords) {
  if (isDatabaseEnabled()) {
    try {
      await prisma.$transaction(async (tx) => {
        const existing = await tx.keyword.findMany({ select: { id: true } });
        const nextIds = new Set(keywords.map((keyword) => keyword.id));
        const removedIds = existing.map((keyword) => keyword.id).filter((id) => !nextIds.has(id));

        if (removedIds.length > 0) {
          await tx.keyword.deleteMany({ where: { id: { in: removedIds } } });
        }

        for (const keyword of keywords) {
          await tx.keyword.upsert({
            where: { id: keyword.id },
            update: toDbKeyword(keyword),
            create: { id: keyword.id, ...toDbKeyword(keyword) }
          });
        }
      });
      return;
    } catch (error) {
      console.warn("Falling back to JSON keywords write:", error.message);
    }
  }

  await fs.mkdir(path.dirname(keywordsFile), { recursive: true });
  await fs.writeFile(keywordsFile, JSON.stringify(keywords, null, 2), "utf8");
}

export async function appendRun(run) {
  if (isDatabaseEnabled()) {
    try {
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
      return;
    } catch (error) {
      console.warn("Falling back to JSON run append:", error.message);
    }
  }

  const runs = await readRuns();
  const nextRuns = [run, ...runs].slice(0, 200);
  await fs.mkdir(path.dirname(runsFile), { recursive: true });
  await fs.writeFile(runsFile, JSON.stringify(nextRuns, null, 2), "utf8");
}

export async function getPublishedTools() {
  const tools = await readTools();
  return tools.filter((tool) => tool.status === "published");
}

export async function getToolBySlug(slug) {
  const tools = await readTools();
  return tools.find((tool) => tool.slug === slug);
}

export function interpolate(template, values) {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => values[key] ?? "");
}

export function buildToolPrompt(tool, values) {
  return interpolate(tool.prompt.userTemplate, values);
}

export function validateTools(tools) {
  if (!Array.isArray(tools)) {
    return "tools must be an array.";
  }

  const slugs = new Set();

  for (const tool of tools) {
    if (!tool.id || !tool.slug || !tool.name) {
      return "Every tool needs id, slug, and name.";
    }

    if (slugs.has(tool.slug)) {
      return `Duplicate slug: ${tool.slug}`;
    }

    slugs.add(tool.slug);

    if (!tool.prompt?.userTemplate || !Array.isArray(tool.fields)) {
      return `${tool.name} needs fields and a user prompt template.`;
    }

    for (const field of tool.fields) {
      if (!field.key || !field.label || !field.type) {
        return `${tool.name} has a field missing key, label, or type.`;
      }
    }
  }

  return "";
}

export function validateKeywords(keywords) {
  if (!Array.isArray(keywords)) {
    return "keywords must be an array.";
  }

  const phrases = new Set();
  for (const keyword of keywords) {
    if (!keyword.id || !keyword.phrase || !keyword.category) {
      return "Every keyword needs id, phrase, and category.";
    }

    const normalized = keyword.phrase.trim().toLowerCase();
    if (phrases.has(normalized)) {
      return `Duplicate keyword: ${keyword.phrase}`;
    }
    phrases.add(normalized);
  }

  return "";
}

export function isDatabaseEnabled() {
  return Boolean(process.env.DATABASE_URL);
}

function toDbTool(tool) {
  return {
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
  };
}

function fromDbTool(tool) {
  return {
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
    sourceKeywordId: tool.sourceKeywordId
  };
}

function toDbKeyword(keyword) {
  return {
    phrase: keyword.phrase,
    category: keyword.category,
    intent: keyword.intent || "tool",
    priority: Number(keyword.priority || 2),
    status: keyword.status || "planned",
    tags: keyword.tags || [],
    notes: keyword.notes || ""
  };
}

function fromDbKeyword(keyword) {
  return {
    id: keyword.id,
    phrase: keyword.phrase,
    category: keyword.category,
    intent: keyword.intent,
    priority: keyword.priority,
    status: keyword.status,
    tags: keyword.tags,
    notes: keyword.notes
  };
}

function fromDbRun(run) {
  return {
    id: run.id,
    toolId: run.toolId,
    toolSlug: run.toolSlug,
    toolName: run.toolName,
    provider: run.provider,
    values: run.values,
    prompt: run.prompt,
    result: run.result,
    error: run.error,
    durationMs: run.durationMs,
    createdAt: run.createdAt.toISOString()
  };
}

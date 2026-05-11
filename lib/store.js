import { promises as fs } from "fs";
import path from "path";

const dataFile = path.join(process.cwd(), "data", "tools.json");
const runsFile = path.join(process.cwd(), "data", "runs.json");

export async function readTools() {
  const raw = await fs.readFile(dataFile, "utf8");
  return JSON.parse(raw);
}

export async function writeTools(tools) {
  await fs.mkdir(path.dirname(dataFile), { recursive: true });
  await fs.writeFile(dataFile, JSON.stringify(tools, null, 2), "utf8");
}

export async function readRuns() {
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

export async function appendRun(run) {
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

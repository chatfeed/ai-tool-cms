import crypto from "crypto";

export function createToolFromKeyword(keyword, existingTools = []) {
  const phrase = keyword.phrase.trim();
  const name = toTitleCase(phrase);
  const slug = uniqueSlug(slugify(phrase), existingTools);
  const category = keyword.category || "Writing";
  const primaryTag = keyword.tags?.[0] || "content";

  return {
    id: crypto.randomUUID(),
    status: "draft",
    slug,
    name: name.startsWith("AI ") ? name : `AI ${name}`,
    category,
    title: `Free ${name} Tool for Fast ${toTitleCase(primaryTag)} Work`,
    description: `Use this free ${phrase} tool to turn a short brief into a useful AI-generated result for ${category.toLowerCase()} workflows.`,
    h1: `Free ${name} Tool`,
    intro: `Create a practical result for ${phrase} use cases in seconds. Enter a short brief, choose a style, and generate an output you can copy, edit, and reuse.`,
    sourceKeywordId: keyword.id,
    fields: [
      {
        key: "brief",
        label: "Brief",
        type: "textarea",
        required: true,
        placeholder: `Describe what you want the ${phrase} tool to create`,
        help: "Add audience, context, and constraints for better output."
      },
      {
        key: "style",
        label: "Style",
        type: "select",
        required: true,
        defaultValue: "practical",
        options: ["practical", "professional", "friendly", "concise", "creative"]
      }
    ],
    prompt: {
      system: `You are an expert ${category.toLowerCase()} assistant.`,
      userTemplate: `Act as a ${phrase} tool. Create a {{style}} result from this brief: {{brief}}`,
      model: "gpt-4o-mini",
      temperature: 0.7
    },
    result: {
      format: "markdown",
      copyable: true
    },
    seo: {
      steps: [
        "Enter the brief or source material.",
        "Choose the style that matches your audience.",
        "Generate the result and refine the strongest version."
      ],
      useCases: [
        `${name} for content planning`,
        `${name} for marketing workflows`,
        `${name} for productivity and drafting`
      ],
      faqs: [
        {
          question: `What is a ${phrase} tool?`,
          answer: `A ${phrase} tool uses AI to turn your form input into a focused result for ${category.toLowerCase()} tasks.`
        },
        {
          question: `How should I use the ${phrase} output?`,
          answer: "Use the generated result as a first draft, then edit it for accuracy, brand voice, and search intent."
        }
      ]
    }
  };
}

export function suggestRelatedTools(currentTool, allTools, keywords = [], limit = 3) {
  const currentKeyword = keywords.find((keyword) => keyword.id === currentTool.sourceKeywordId);
  const currentTags = new Set(currentKeyword?.tags || []);

  return allTools
    .filter((tool) => tool.slug !== currentTool.slug && tool.status === "published")
    .map((tool) => {
      const keyword = keywords.find((item) => item.id === tool.sourceKeywordId);
      const tagOverlap = (keyword?.tags || []).filter((tag) => currentTags.has(tag)).length;
      const categoryScore = tool.category === currentTool.category ? 3 : 0;
      const keywordScore = currentKeyword && keyword?.intent === currentKeyword.intent ? 1 : 0;
      return { tool, score: categoryScore + keywordScore + tagOverlap };
    })
    .sort((first, second) => second.score - first.score || first.tool.name.localeCompare(second.tool.name))
    .slice(0, limit)
    .map((item) => item.tool);
}

function toTitleCase(value) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function uniqueSlug(base, tools) {
  const slugs = new Set(tools.map((tool) => tool.slug));
  let candidate = base || "ai-tool";
  let index = 2;

  while (slugs.has(candidate)) {
    candidate = `${base}-${index}`;
    index += 1;
  }

  return candidate;
}

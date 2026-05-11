export async function generateMockResult(tool, values, prompt) {
  const topic = values.topic || values.keyword || values.text || values.url || "your input";
  const tone = values.tone || values.style || "clear";
  const count = Number(values.count || 5);

  if (tool.result?.format === "list") {
    return Array.from({ length: Math.min(Math.max(count, 1), 12) }, (_, index) => {
      return `${index + 1}. ${capitalize(tone)} ${tool.name.replace(/^AI\s+/i, "")}: ${topic} idea ${index + 1}`;
    }).join("\n");
  }

  return [
    `Generated result for ${tool.name}`,
    "",
    `Input focus: ${topic}`,
    `Preferred style: ${tone}`,
    "",
    "This MVP is wired through the same form -> prompt -> result pipeline you can later connect to OpenAI or another model provider.",
    "",
    "Prompt preview:",
    prompt
  ].join("\n");
}

function capitalize(value) {
  const text = String(value);
  return text.charAt(0).toUpperCase() + text.slice(1);
}

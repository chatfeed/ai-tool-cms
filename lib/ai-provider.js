import { generateMockResult } from "@/lib/mock-ai";

export async function generateToolResult(tool, values, prompt) {
  if (!process.env.OPENAI_API_KEY) {
    return {
      provider: "mock",
      result: await generateMockResult(tool, values, prompt)
    };
  }

  const model = tool.prompt?.model || "gpt-4o-mini";
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      temperature: Number(tool.prompt?.temperature ?? 0.7),
      messages: [
        { role: "system", content: tool.prompt?.system || "You are a helpful assistant." },
        { role: "user", content: prompt }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "AI provider request failed.");
  }

  const payload = await response.json();
  return {
    provider: "openai",
    result: payload.choices?.[0]?.message?.content || ""
  };
}

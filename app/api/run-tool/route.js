import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isAdminAuthEnabled, isAuthenticatedFromCookies } from "@/lib/auth";
import { generateToolResult } from "@/lib/ai-provider";
import { appendRun, buildToolPrompt, getToolBySlug } from "@/lib/store";

export async function POST(request) {
  const startedAt = Date.now();
  const body = await request.json();
  const tool = await getToolBySlug(body.slug);
  const canPreview = !isAdminAuthEnabled() || isAuthenticatedFromCookies(cookies());

  if (!tool || (tool.status !== "published" && (body.preview !== true || !canPreview))) {
    return NextResponse.json({ error: "Tool not found." }, { status: 404 });
  }

  const values = body.values || {};
  const missing = tool.fields.find((field) => field.required && !String(values[field.key] || "").trim());

  if (missing) {
    return NextResponse.json({ error: `${missing.label} is required.` }, { status: 400 });
  }

  const prompt = buildToolPrompt(tool, values);
  try {
    const generated = await generateToolResult(tool, values, prompt);
    const run = {
      id: crypto.randomUUID(),
      toolId: tool.id,
      toolSlug: tool.slug,
      toolName: tool.name,
      provider: generated.provider,
      values,
      prompt,
      result: generated.result,
      createdAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt
    };

    await appendRun(run);

    return NextResponse.json({
      result: generated.result,
      prompt,
      provider: generated.provider,
      durationMs: run.durationMs
    });
  } catch (error) {
    await appendRun({
      id: crypto.randomUUID(),
      toolId: tool.id,
      toolSlug: tool.slug,
      toolName: tool.name,
      provider: "error",
      values,
      prompt,
      result: "",
      error: error.message,
      createdAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt
    });

    return NextResponse.json({ error: "AI generation failed." }, { status: 502 });
  }
}

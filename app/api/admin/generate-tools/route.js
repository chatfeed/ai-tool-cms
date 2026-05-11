import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isAdminAuthEnabled, isAuthenticatedFromCookies } from "@/lib/auth";
import { createToolFromKeyword } from "@/lib/growth";
import { readKeywords, readTools, validateTools, writeKeywords, writeTools } from "@/lib/store";

export async function POST(request) {
  if (isAdminAuthEnabled() && !isAuthenticatedFromCookies(cookies())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json();
  const keywordIds = Array.isArray(body.keywordIds) ? body.keywordIds : [];
  const tools = await readTools();
  const keywords = await readKeywords();
  const selectedKeywords = keywords.filter((keyword) => keywordIds.includes(keyword.id));

  if (selectedKeywords.length === 0) {
    return NextResponse.json({ error: "Select at least one keyword." }, { status: 400 });
  }

  const existingKeywordIds = new Set(tools.map((tool) => tool.sourceKeywordId).filter(Boolean));
  const generatedTools = [];
  let nextTools = [...tools];

  for (const keyword of selectedKeywords) {
    if (existingKeywordIds.has(keyword.id)) {
      continue;
    }

    const tool = createToolFromKeyword(keyword, nextTools);
    generatedTools.push(tool);
    nextTools = [tool, ...nextTools];
    existingKeywordIds.add(keyword.id);
  }

  const validationError = validateTools(nextTools);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const nextKeywords = keywords.map((keyword) => {
    if (!generatedTools.some((tool) => tool.sourceKeywordId === keyword.id)) {
      return keyword;
    }
    return { ...keyword, status: "generated" };
  });

  await writeTools(nextTools);
  await writeKeywords(nextKeywords);

  return NextResponse.json({
    generated: generatedTools.length,
    tools: nextTools,
    keywords: nextKeywords
  });
}

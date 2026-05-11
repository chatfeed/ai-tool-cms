import crypto from "crypto";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isAdminAuthEnabled, isAuthenticatedFromCookies } from "@/lib/auth";
import { createToolFromKeyword } from "@/lib/growth";
import {
  readKeywords,
  readTools,
  validateKeywords,
  validateTools,
  writeKeywords,
  writeTools
} from "@/lib/store";

export async function POST(request) {
  if (isAdminAuthEnabled() && !isAuthenticatedFromCookies(cookies())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json();
  const selectedIds = Array.isArray(body.selectedIds) ? body.selectedIds : [];
  const opportunities = Array.isArray(body.opportunities) ? body.opportunities : [];

  if (selectedIds.length === 0 || opportunities.length === 0) {
    return NextResponse.json({ error: "Select opportunities to generate tools." }, { status: 400 });
  }

  const selected = opportunities.filter((item) => selectedIds.includes(item.id));
  if (selected.length === 0) {
    return NextResponse.json({ error: "Selected opportunities not found." }, { status: 400 });
  }

  const tools = await readTools();
  const keywords = await readKeywords();
  const keywordByPhrase = new Map(keywords.map((keyword) => [keyword.phrase.trim().toLowerCase(), keyword]));
  const existingKeywordIds = new Set(tools.map((tool) => tool.sourceKeywordId).filter(Boolean));

  let nextKeywords = [...keywords];
  let nextTools = [...tools];
  const createdTools = [];

  for (const opportunity of selected) {
    const phraseKey = String(opportunity.phrase || "").trim().toLowerCase();
    if (!phraseKey) continue;

    let keyword = keywordByPhrase.get(phraseKey);
    if (!keyword) {
      keyword = {
        id: crypto.randomUUID(),
        ...opportunity.keywordDraft
      };
      keywordByPhrase.set(phraseKey, keyword);
      nextKeywords = [keyword, ...nextKeywords];
    }

    if (existingKeywordIds.has(keyword.id)) {
      continue;
    }

    const tool = createToolFromKeyword(keyword, nextTools);
    tool.sourceKeywordId = keyword.id;
    tool.status = "draft";
    createdTools.push(tool);
    nextTools = [tool, ...nextTools];
    existingKeywordIds.add(keyword.id);
  }

  const keywordValidationError = validateKeywords(nextKeywords);
  if (keywordValidationError) {
    return NextResponse.json({ error: keywordValidationError }, { status: 400 });
  }

  const toolValidationError = validateTools(nextTools);
  if (toolValidationError) {
    return NextResponse.json({ error: toolValidationError }, { status: 400 });
  }

  await writeKeywords(nextKeywords);
  await writeTools(nextTools);

  return NextResponse.json({
    createdTools: createdTools.length,
    tools: nextTools,
    keywords: nextKeywords
  });
}

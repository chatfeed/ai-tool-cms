import crypto from "crypto";

const intentRules = [
  { pattern: /(generator|generate|maker|create)/i, toolType: "generator", intent: "create" },
  { pattern: /(converter|convert|to\s+\w+)/i, toolType: "converter", intent: "transform" },
  { pattern: /(calculator|estimate|cost|price|roi)/i, toolType: "calculator", intent: "calculate" },
  { pattern: /(checker|validator|detector|test)/i, toolType: "checker", intent: "verify" },
  { pattern: /(summarizer|summary|rewrite|paraphrase)/i, toolType: "summarizer", intent: "summarize" }
];

export function analyzeKeywordOpportunities(queries) {
  return queries
    .map((query) => {
      const phrase = String(query.keyword || "").trim();
      if (!phrase) return null;

      const matched = intentRules.find((rule) => rule.pattern.test(phrase)) || {
        toolType: "generator",
        intent: "create"
      };

      const searchVolume = normalizeMetric(query.searchVolume, 200);
      const competition = normalizeMetric(query.competition, 0.4);
      const intentFit = scoreIntentFit(phrase);
      const phraseQuality = scorePhraseQuality(phrase);
      const sourceTrust = scoreSource(query.source);
      const score = clamp(Math.round(
        searchVolume * 0.35 +
        (1 - competition) * 100 * 0.25 +
        intentFit * 0.2 +
        phraseQuality * 0.1 +
        sourceTrust * 0.1
      ), 1, 100);

      const category = suggestCategory(phrase, matched.toolType);

      return {
        id: crypto.randomUUID(),
        phrase,
        source: query.source || "manual",
        searchVolume: Math.round(searchVolume),
        competition: Number(competition.toFixed(2)),
        intent: matched.intent,
        toolType: matched.toolType,
        category,
        score,
        rationale: buildRationale({ competition, intentFit, phraseQuality, searchVolume, sourceTrust }),
        keywordDraft: {
          phrase,
          category,
          intent: "tool",
          priority: score >= 80 ? 5 : score >= 65 ? 4 : score >= 50 ? 3 : 2,
          status: "planned",
          tags: [matched.toolType, matched.intent, query.source || "manual"],
          notes: `Discovery score: ${score}. Source: ${query.source || "manual"}.`
        }
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score);
}

function normalizeMetric(value, fallback) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) return fallback;
  return numeric;
}

function scoreIntentFit(phrase) {
  const hasToolVerb = /(generate|convert|calculate|check|summarize|rewrite|extract|optimi[sz]e|planner|builder)/i.test(phrase);
  const hasConcreteObject = /(title|email|headline|caption|summary|resume|bio|description|script|cost|grade|score|pdf|seo|keyword)/i.test(phrase);
  return (hasToolVerb ? 60 : 30) + (hasConcreteObject ? 40 : 10);
}

function scorePhraseQuality(phrase) {
  const words = phrase.split(/\s+/).filter(Boolean).length;
  if (words < 2) return 35;
  if (words <= 6) return 90;
  if (words <= 9) return 70;
  return 55;
}

function scoreSource(source = "") {
  if (/gsc|search\s*console/i.test(source)) return 95;
  if (/trends|keyword\s*tool|semrush|ahrefs|dataforseo|serp/i.test(source)) return 80;
  if (/internal|onsite|logs/i.test(source)) return 75;
  return 60;
}

function suggestCategory(phrase, toolType) {
  if (/(seo|keyword|title|meta|headline|ad|caption|email)/i.test(phrase)) return "Marketing";
  if (/(summary|rewrite|grammar|essay|blog|article|script)/i.test(phrase)) return "Writing";
  if (/(pdf|csv|json|sql|regex|code|api)/i.test(phrase)) return "Developer";
  if (/(resume|job|interview|cover letter)/i.test(phrase)) return "Career";
  if (/(calculator|roi|budget|price|cost)/i.test(phrase)) return "Business";
  return toolType === "calculator" ? "Business" : "Writing";
}

function buildRationale({ competition, intentFit, phraseQuality, searchVolume, sourceTrust }) {
  const parts = [];
  parts.push(searchVolume >= 500 ? "decent demand signal" : "low-to-medium demand signal");
  parts.push(competition <= 0.45 ? "manageable competition" : "competitive SERP");
  parts.push(intentFit >= 80 ? "clear tool intent" : "mixed search intent");
  parts.push(phraseQuality >= 80 ? "clean long-tail phrasing" : "phrase needs refining");
  parts.push(sourceTrust >= 80 ? "high-trust source input" : "manual source confidence");
  return parts.join(" · ");
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

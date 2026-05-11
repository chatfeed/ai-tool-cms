export async function fetchDiscoverySignals({
  geo = "US",
  allowFallback = true,
  keywords = [],
  provider = "internal_seed",
  toolRuns = []
}) {
  if (provider === "internal_seed") {
    return {
      providerUsed: "internal_seed",
      queries: buildInternalSeedSignals(keywords, toolRuns)
    };
  }

  if (provider === "google_trends_free") {
    try {
      const trendsSignals = await fetchGoogleTrendsRssSignals(geo);
      if (trendsSignals.length > 0) {
        return {
          providerUsed: "google_trends_free",
          queries: trendsSignals
        };
      }

      if (!allowFallback) {
        throw new Error("Google Trends returned no rows.");
      }
    } catch (error) {
      if (!allowFallback) {
        throw error;
      }

      console.warn("google_trends_free fetch failed, fallback to internal_seed:", error.message);
    }

    return {
      providerUsed: "internal_seed",
      warning: "Google Trends fetch failed, returned internal seed signals instead.",
      queries: buildInternalSeedSignals(keywords, toolRuns)
    };
  }

  if (provider === "gsc_csv_payload") {
    return { providerUsed: "gsc_csv_payload", queries: [] };
  }

  return { providerUsed: provider, queries: [] };
}

async function fetchGoogleTrendsRssSignals(geo) {
  const safeGeo = String(geo || "US").toUpperCase();
  const urls = [
    `https://trends.google.com/trends/trendingsearches/daily/rss?geo=${encodeURIComponent(safeGeo)}`,
    `https://trends.google.com/trending/rss?geo=${encodeURIComponent(safeGeo)}`
  ];

  let xml = "";
  let lastError = "";

  for (const url of urls) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const response = await fetch(url, {
        headers: {
          "User-Agent": "ToolForge-AI/1.0",
          "Accept": "application/rss+xml, application/xml;q=0.9, */*;q=0.1"
        },
        cache: "no-store",
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (!response.ok) {
        lastError = `endpoint ${url} returned ${response.status}`;
        continue;
      }

      xml = await response.text();
      if (xml.includes("<rss") || xml.includes("<channel")) {
        break;
      }

      lastError = `endpoint ${url} returned non-RSS payload`;
    } catch (error) {
      lastError = error.name === "AbortError"
        ? `endpoint ${url} timed out`
        : `endpoint ${url} failed: ${error.message}`;
    }
  }

  if (!xml) {
    throw new Error(lastError || "all Google Trends endpoints failed");
  }

  const items = extractTagBlocks(xml, "item");

  return items
    .map((item, index) => {
      const title = decodeXmlEntities(extractTag(item, "title"));
      if (!title) return null;

      const trafficText = decodeXmlEntities(extractTag(item, "ht:approx_traffic"));
      const volume = normalizeTraffic(trafficText, index);
      const competition = estimateTrendsCompetition(index, volume);

      return {
        keyword: title.toLowerCase(),
        source: "google-trends-free",
        searchVolume: volume,
        competition
      };
    })
    .filter(Boolean)
    .slice(0, 80);
}

function buildInternalSeedSignals(keywords, toolRuns) {
  const baseSignals = keywords.map((keyword, index) => ({
    keyword: keyword.phrase,
    source: "internal-logs",
    searchVolume: 400 + (index % 6) * 260 + (keyword.priority || 2) * 120,
    competition: clamp(0.25 + (index % 5) * 0.08, 0.2, 0.78)
  }));

  const runDerived = toolRuns
    .slice(0, 80)
    .map((run) => String(run.prompt || ""))
    .map((text) => text.match(/\b(ai\s+[a-z0-9\s-]{4,40}\s+(generator|converter|checker|calculator|summarizer))\b/i))
    .filter(Boolean)
    .map((match, index) => ({
      keyword: match[1].trim().toLowerCase(),
      source: "internal-logs",
      searchVolume: 280 + (index % 8) * 140,
      competition: clamp(0.22 + (index % 7) * 0.07, 0.2, 0.75)
    }));

  return dedupeSignals([...baseSignals, ...runDerived]).slice(0, 200);
}

function dedupeSignals(signals) {
  const seen = new Set();
  return signals.filter((signal) => {
    const key = signal.keyword.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function extractTagBlocks(xml, tagName) {
  const regex = new RegExp(`<${tagName}>([\\s\\S]*?)</${tagName}>`, "gi");
  const blocks = [];
  let match = regex.exec(xml);
  while (match) {
    blocks.push(match[1]);
    match = regex.exec(xml);
  }
  return blocks;
}

function extractTag(xml, tagName) {
  const regex = new RegExp(`<${tagName}>([\\s\\S]*?)</${tagName}>`, "i");
  const match = regex.exec(xml);
  return match?.[1]?.trim() || "";
}

function decodeXmlEntities(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'");
}

function normalizeTraffic(text, index) {
  const raw = String(text || "").toUpperCase().replace(/[^0-9.KM]/g, "");
  const number = Number(raw.replace(/[KM]/g, ""));
  if (!Number.isFinite(number) || number <= 0) {
    return 6000 - index * 40;
  }

  if (raw.includes("M")) return Math.round(number * 1_000_000);
  if (raw.includes("K")) return Math.round(number * 1_000);
  return Math.round(number);
}

function estimateTrendsCompetition(index, volume) {
  const base = volume > 200000 ? 0.72 : volume > 50000 ? 0.62 : 0.5;
  return clamp(base + (index % 7) * 0.02, 0.35, 0.85);
}

export function parseDiscoveryInput(text, source) {
  const clean = String(text || "").trim();
  if (!clean) return [];

  if (source === "gsc") {
    const csvRows = parseCsvLines(clean);
    const mapped = mapGscRows(csvRows);
    if (mapped.length > 0) return mapped;
  }

  return clean
    .split("\n")
    .map((row) => row.trim())
    .filter(Boolean)
    .map((row) => {
      const [keyword, volume = "", competition = ""] = row.split(",").map((item) => item.trim());
      return {
        keyword,
        source,
        searchVolume: volume ? Number(volume) : undefined,
        competition: competition ? Number(competition) : undefined
      };
    })
    .filter((item) => item.keyword);
}

function mapGscRows(rows) {
  if (rows.length < 2) return [];
  const header = rows[0].map((value) => normalizeHeader(value));

  const idxQuery = findHeaderIndex(header, ["query", "top queries", "queries"]);
  const idxClicks = findHeaderIndex(header, ["clicks"]);
  const idxImpressions = findHeaderIndex(header, ["impressions"]);
  const idxCtr = findHeaderIndex(header, ["ctr", "site ctr"]);
  const idxPosition = findHeaderIndex(header, ["position", "average position"]);

  if (idxQuery === -1) return [];

  return rows.slice(1)
    .map((row) => {
      const keyword = String(row[idxQuery] || "").trim();
      if (!keyword) return null;

      const clicks = toNumber(row[idxClicks]);
      const impressions = toNumber(row[idxImpressions]);
      const ctr = toPercent(row[idxCtr]);
      const position = toNumber(row[idxPosition]);

      const demandSignal = impressions > 0 ? impressions : clicks > 0 ? clicks * 8 : 0;
      const competition = estimateCompetition(ctr, position);

      return {
        keyword,
        source: "gsc",
        searchVolume: demandSignal || undefined,
        competition
      };
    })
    .filter(Boolean);
}

function parseCsvLines(input) {
  const lines = input.split(/\r?\n/).filter((line) => line.trim());
  return lines.map((line) => splitCsvLine(line));
}

function splitCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === "\"") {
      if (inQuotes && next === "\"") {
        current += "\"";
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  result.push(current.trim());
  return result;
}

function normalizeHeader(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\uFEFF/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function findHeaderIndex(header, candidates) {
  const normalized = candidates.map((candidate) => candidate.toLowerCase());
  return header.findIndex((value) => normalized.includes(value));
}

function toNumber(value) {
  const text = String(value || "").replace(/,/g, "").trim();
  const numeric = Number(text);
  return Number.isFinite(numeric) ? numeric : 0;
}

function toPercent(value) {
  const text = String(value || "").replace("%", "").trim();
  const numeric = Number(text);
  if (!Number.isFinite(numeric)) return 0;
  return numeric / 100;
}

function estimateCompetition(ctr, position) {
  if (ctr > 0.25 && position <= 3) return 0.35;
  if (ctr > 0.12 && position <= 8) return 0.5;
  if (position > 20) return 0.28;
  return 0.42;
}

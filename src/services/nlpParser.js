const { lookupCountryCode, COUNTRY_MAP } = require("../utils/countryMap");

// "young" maps to age 16–24 per spec — not a stored age_group
const YOUNG_MIN = 16;
const YOUNG_MAX = 24;

const AGE_GROUP_KEYWORDS = {
  child: "child",
  children: "child",
  kid: "child",
  kids: "child",
  teenager: "teenager",
  teenagers: "teenager",
  teen: "teenager",
  teens: "teenager",
  adult: "adult",
  adults: "adult",
  senior: "senior",
  seniors: "senior",
  elderly: "senior",
};

function parseNLQuery(q) {
  if (!q || typeof q !== "string" || q.trim().length === 0) return null;

  const raw = q.trim().toLowerCase();
  const filters = {};

  // 1. Gender — both present = no gender filter
  const hasMale = /\b(male|males|man|men)\b/.test(raw);
  const hasFemale = /\b(female|females|woman|women)\b/.test(raw);
  if (hasMale && !hasFemale) filters.gender = "male";
  if (hasFemale && !hasMale) filters.gender = "female";

  // 2. Age group
  for (const [kw, group] of Object.entries(AGE_GROUP_KEYWORDS)) {
    if (new RegExp(`\\b${kw}\\b`).test(raw)) {
      filters.age_group = group;
      break;
    }
  }

  // 3. "young" → 16–24 (overrides age_group per spec)
  if (/\byoung\b/.test(raw)) {
    delete filters.age_group;
    filters.min_age = YOUNG_MIN;
    filters.max_age = YOUNG_MAX;
  }

  // 4. Numeric age modifiers
  const aboveMatch = raw.match(
    /\b(?:above|over|older\s+than|at\s+least)\s+(\d+)/,
  );
  if (aboveMatch) {
    const n = parseInt(aboveMatch[1], 10);
    filters.min_age = n;
    if (filters.max_age !== undefined && n > filters.max_age)
      delete filters.max_age;
  }

  const belowMatch = raw.match(
    /\b(?:below|under|younger\s+than|at\s+most)\s+(\d+)/,
  );
  if (belowMatch) filters.max_age = parseInt(belowMatch[1], 10);

  // 5. Country — "from X" / "in X" first, then full scan
  const prepMatch = raw.match(
    /\b(?:from|in)\s+([a-z][a-z\s\-']*?)(?:\s+(?:who|that|with|above|below|over|under|age|and|where|aged)|$)/,
  );
  if (prepMatch) {
    const code = findCountryCode(prepMatch[1].trim());
    if (code) filters.country_id = code;
  }
  if (!filters.country_id) {
    const code = scanForCountry(raw);
    if (code) filters.country_id = code;
  }

  if (Object.keys(filters).length === 0) return null;
  return filters;
}

function findCountryCode(candidate) {
  if (!candidate) return null;
  let code = lookupCountryCode(candidate.trim());
  if (code) return code;
  const words = candidate.trim().split(/\s+/);
  for (let end = words.length - 1; end >= 1; end--) {
    code = lookupCountryCode(words.slice(0, end).join(" "));
    if (code) return code;
  }
  return null;
}

function scanForCountry(raw) {
  const entries = Object.entries(COUNTRY_MAP).sort(
    (a, b) => b[0].length - a[0].length,
  );
  for (const [name, code] of entries) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`\\b${escaped}\\b`).test(raw)) return code;
  }
  return null;
}

module.exports = { parseNLQuery };

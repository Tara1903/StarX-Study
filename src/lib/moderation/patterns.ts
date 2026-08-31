/**
 * Moderation regex patterns for content detection.
 * Covers English profanity, Hinglish abuse, personal attacks,
 * hostile dismissals, and PII detection.
 */

export interface PatternMatch {
  pattern: string;
  category: string;
  severity: "low" | "medium" | "high" | "critical";
}

// ============================================
// English profanity patterns (common, normalized)
// ============================================
const ENGLISH_PROFANITY = [
  "fuck", "fuuck", "fuk", "fck", "f.u.c.k",
  "shit", "shiit", "sh1t",
  "ass", "asshole", "ashole",
  "bitch", "biatch", "b1tch",
  "damn", "damm",
  "dick", "d1ck",
  "cunt",
  "bastard", "baastard",
  "crap",
  "piss",
  "slut", "whore",
  "wanker", "twat",
  "stfu", "gtfo", "lmfao",
];

// ============================================
// Hinglish profanity patterns (Romanized Hindi/Urdu)
// ============================================
const HINGLISH_PROFANITY = [
  "bhenchod", "behenchod", "benchod", "bc",
  "madarchod", "madarc", "mc",
  "chutiya", "chutya", "chuutiya", "chootiya",
  "gandu", "gaandu",
  "bhosdike", "bhosdiwale",
  "harami", "haraami",
  "kameena", "kamina", "kaminey",
  "laude", "lavde",
  "lodu",
  "lund",
  "randi", "raand",
  "saale", "saala", "sala",
  "suar", "suwar",
  "bkl",
  "gadha",
  "ullu",
  "kutta", "kutte", "kutiya",
  "bakwaas",
];

// ============================================
// Devanagari profanity patterns
// ============================================
const DEVANAGARI_PROFANITY = [
  "भड़वा", "भोसड़ी", "चूतिया", "गांडू", "हरामी",
  "कमीना", "कुत्ता", "कुत्ती", "लौड़ा", "लोडू",
  "मादरचोद", "रंडी", "साला", "सूअर",
];

// Build word boundary patterns
function buildWordPatterns(words: string[]): RegExp {
  const escaped = words.map((w) =>
    w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  );
  return new RegExp(`\\b(?:${escaped.join("|")})\\b`, "i");
}

function buildDevanagariPatterns(words: string[]): RegExp {
  const escaped = words.map((w) =>
    w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  );
  return new RegExp(`(?:${escaped.join("|")})`, "i");
}

// Compiled patterns
const ENGLISH_PATTERN = buildWordPatterns(ENGLISH_PROFANITY);
const HINGLISH_PATTERN = buildWordPatterns(HINGLISH_PROFANITY);
const DEVANAGARI_PATTERN = buildDevanagariPatterns(DEVANAGARI_PROFANITY);

// Direct personal attack pattern
const DIRECT_ATTACK_PATTERN = new RegExp(
  "\\b(?:you|u|tu|tera|teri|tum|tumhara)\\s+" +
    "(?:are\\s+|r\\s+|is\\s+|hai\\s+|ho\\s+)?" +
    "(?:an?\\s+|ek\\s+)?" +
    "(?:stupid|idiot|loser|fool|moron|dumb|donkey|retard|" +
    "chutiya|gandu|kutta|kamina|harami|gadha|ullu|" +
    "useless|worthless|pathetic|trash|garbage|brainless)\\b",
  "i"
);

// Hostile dismissal pattern
const HOSTILE_DISMISSAL_PATTERN = new RegExp(
  "\\b(?:shut\\s*up|get\\s*lost|stfu|get\\s*out|go\\s*away|" +
    "nikal\\s*yahan\\s*se|bakwaas\\s*band\\s*kar|" +
    "chup\\s*(?:ho|reh|rho)|khamosh|" +
    "die|kill\\s*yourself|kys)\\b",
  "i"
);

// Threat/violence pattern
const THREAT_PATTERN = new RegExp(
  "\\b(?:i(?:'ll|\\s*will)\\s+(?:kill|beat|hurt|punch|slap|destroy|murder)|" +
    "(?:mar|maar)\\s*(?:dunga|dungi|daalenge)|" +
    "(?:jaan|jeen)\\s*se\\s*(?:maar|maarenge)|" +
    "threat|bomb|gun|knife|weapon|attack)\\b",
  "i"
);

// Sexual content pattern
const SEXUAL_PATTERN = new RegExp(
  "\\b(?:sex|sexy|boob|nude|naked|porn|xxx|" +
    "send\\s*(?:nudes|pics|photos)|" +
    "hot\\s*(?:girl|boy|babe)|" +
    "date\\s*me|hookup|hook\\s*up)\\b",
  "i"
);

// Spam patterns
const SPAM_PATTERN = new RegExp(
  "(?:(?:https?:\\/\\/)?(?:discord\\.(?:gg|io|me)|t\\.me\\/|" +
    "chegg\\.com|brainly\\.(?:in|com)|coursehero\\.com)|" +
    "(?:buy|sell|earn|free\\s*money|click\\s*here|subscribe|" +
    "follow\\s+(?:me|my)|join\\s*(?:my|this)|check\\s*(?:this|my)\\s*(?:link|channel)))",
  "i"
);

// Indian phone number (PII protection)
const PHONE_PATTERN = /(?:(?:\+?91[\-\s]?)?|0)?[6-9]\d{4}[\-\s]?\d{5}/;

/**
 * Check text against all moderation patterns.
 * Returns array of matches found.
 */
export function checkPatterns(normalizedText: string, originalText: string): PatternMatch[] {
  const matches: PatternMatch[] = [];

  // Check threats first (highest severity)
  if (THREAT_PATTERN.test(normalizedText)) {
    matches.push({
      pattern: "threat_violence",
      category: "Threat or violence",
      severity: "critical",
    });
  }

  // Sexual content
  if (SEXUAL_PATTERN.test(normalizedText)) {
    matches.push({
      pattern: "sexual_content",
      category: "Sexual content",
      severity: "high",
    });
  }

  // Direct personal attack
  if (DIRECT_ATTACK_PATTERN.test(normalizedText)) {
    matches.push({
      pattern: "personal_attack",
      category: "Personal attack",
      severity: "high",
    });
  }

  // Hostile dismissal
  if (HOSTILE_DISMISSAL_PATTERN.test(normalizedText)) {
    matches.push({
      pattern: "hostile_dismissal",
      category: "Hostile dismissal",
      severity: "medium",
    });
  }

  // English profanity
  if (ENGLISH_PATTERN.test(normalizedText)) {
    matches.push({
      pattern: "english_profanity",
      category: "Profanity",
      severity: "medium",
    });
  }

  // Hinglish profanity
  if (HINGLISH_PATTERN.test(normalizedText)) {
    matches.push({
      pattern: "hinglish_profanity",
      category: "Profanity (Hinglish)",
      severity: "medium",
    });
  }

  // Devanagari profanity (check original text, not normalized)
  if (DEVANAGARI_PATTERN.test(originalText)) {
    matches.push({
      pattern: "devanagari_profanity",
      category: "Profanity (Hindi)",
      severity: "medium",
    });
  }

  // Spam/cheating links
  if (SPAM_PATTERN.test(normalizedText) || SPAM_PATTERN.test(originalText)) {
    matches.push({
      pattern: "spam_links",
      category: "Spam or academic dishonesty link",
      severity: "low",
    });
  }

  // Phone number (PII)
  if (PHONE_PATTERN.test(originalText)) {
    matches.push({
      pattern: "phone_number",
      category: "Personal phone number shared",
      severity: "low",
    });
  }

  return matches;
}

/**
 * Get the highest severity from a list of matches
 */
export function getHighestSeverity(
  matches: PatternMatch[]
): "low" | "medium" | "high" | "critical" | null {
  if (matches.length === 0) return null;

  const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
  let highest: PatternMatch["severity"] = "low";

  for (const match of matches) {
    if (severityOrder[match.severity] > severityOrder[highest]) {
      highest = match.severity;
    }
  }

  return highest;
}

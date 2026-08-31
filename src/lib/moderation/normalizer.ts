/**
 * Text normalizer for moderation pipeline.
 * Handles Unicode homoglyphs, leetspeak, zero-width characters,
 * repeated characters, and Hinglish phonetic variations.
 */

// Cyrillic and Greek lookalike → Latin mappings
const HOMOGLYPH_MAP: Record<string, string> = {
  // Cyrillic
  "а": "a", "А": "A", "в": "b", "В": "B", "е": "e", "Е": "E",
  "к": "k", "К": "K", "м": "m", "М": "M", "н": "h", "Н": "H",
  "о": "o", "О": "O", "р": "p", "Р": "P", "с": "c", "С": "C",
  "т": "t", "Т": "T", "у": "y", "У": "Y", "х": "x", "Х": "X",
  // Greek
  "α": "a", "Α": "A", "β": "b", "Β": "B", "ε": "e", "Ε": "E",
  "ι": "i", "Ι": "I", "κ": "k", "Κ": "K", "ν": "v", "Ν": "N",
  "ο": "o", "Ο": "O", "ρ": "p", "Ρ": "P", "τ": "t", "Τ": "T",
};

// Leetspeak mappings
const LEET_MAP: Record<string, string> = {
  "@": "a", "4": "a",
  "8": "b",
  "3": "e", "€": "e",
  "9": "g", "6": "g",
  "#": "h",
  "1": "i", "!": "i",
  "0": "o",
  "5": "s", "$": "s",
  "7": "t", "+": "t",
};

// Hinglish phonetic equivalences
const PHONETIC_REPLACEMENTS: [RegExp, string][] = [
  [/oo/g, "u"],
  [/ee/g, "i"],
  [/ph/g, "f"],
  [/kh/g, "k"],
  [/bh/g, "b"],
  [/dh/g, "d"],
  [/chh/g, "ch"],
  [/sh/g, "s"],
];

/**
 * Full normalization pipeline: homoglyphs → zero-width → leetspeak → repeated chars → phonetics
 */
export function normalizeText(text: string): string {
  let normalized = text;

  // 1. Unicode NFKD decomposition (strips accent marks)
  normalized = normalized.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");

  // 2. Strip zero-width and invisible characters
  normalized = normalized.replace(/[\u200B-\u200D\uFEFF\u00AD\u2060\u180E]/g, "");

  // 3. Replace homoglyphs
  let result = "";
  for (const char of normalized) {
    result += HOMOGLYPH_MAP[char] || char;
  }
  normalized = result;

  // 4. Lowercase for matching
  normalized = normalized.toLowerCase();

  // 5. Replace leetspeak characters
  result = "";
  for (const char of normalized) {
    result += LEET_MAP[char] || char;
  }
  normalized = result;

  // 6. Remove spaced-out evasion: "s.t.u.p.i.d" or "s_t_u_p_i_d" → "stupid"
  normalized = normalized.replace(
    /\b([a-z])[\s.\-_*]{1,2}([a-z])[\s.\-_*]{1,2}([a-z])[\s.\-_*]{1,2}([a-z])/g,
    "$1$2$3$4"
  );

  // 7. Collapse repeated characters (3+ → 2): "stuuuupid" → "stuupid"
  normalized = normalized.replace(/(.)\1{2,}/g, "$1$1");

  // 8. Apply Hinglish phonetic normalization
  for (const [pattern, replacement] of PHONETIC_REPLACEMENTS) {
    normalized = normalized.replace(pattern, replacement);
  }

  return normalized;
}

/**
 * Check if text contains Devanagari script (Hindi/Sanskrit/etc.)
 */
export function containsDevanagari(text: string): boolean {
  return /[\u0900-\u097F]/.test(text);
}

/**
 * Basic text sanitization for display (removes control characters but preserves content)
 */
export function sanitizeForDisplay(text: string): string {
  // Remove control characters except newlines and tabs
  return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
}

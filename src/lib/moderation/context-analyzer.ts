/**
 * Context-aware analyzer that distinguishes academic critique from personal attacks.
 * Uses rule-based syntactic analysis (no ML dependency).
 */

export enum ContextAction {
  NEUTRAL = "NEUTRAL",
  ALLOW = "ALLOW",
  SOFT_WARN = "SOFT_WARN",
  BLOCK = "BLOCK",
}

export interface ContextResult {
  action: ContextAction;
  reason?: string;
  target?: "content" | "person";
}

// Academic objects that are valid targets for critique
const ACADEMIC_OBJECTS = new Set([
  "answer", "solution", "code", "proof", "step", "formula",
  "calculation", "method", "logic", "derivation", "essay",
  "homework", "assignment", "diagram", "graph", "result",
  "theory", "equation", "response", "approach", "work",
  "question", "problem", "example", "explanation", "argument",
  "thesis", "hypothesis", "experiment", "data", "analysis",
  "conclusion", "finding", "observation", "note", "summary",
  "presentation", "report", "project", "paper", "paragraph",
]);

// Valid academic critique words
const CRITIQUE_WORDS = new Set([
  "wrong", "incorrect", "flawed", "invalid", "incomplete",
  "inaccurate", "illogical", "broken", "false", "confusing",
  "unclear", "ambiguous", "misleading", "vague", "weak",
  "missing", "lacking", "poor", "bad", "terrible",
  "nonsense", "contradictory", "irrelevant",
]);

// Personal insult words
const PERSONAL_INSULTS = new Set([
  "stupid", "idiot", "fool", "loser", "dumb", "moron",
  "retard", "clueless", "useless", "ugly", "fat",
  "blind", "donkey", "trash", "pathetic", "worthless",
  "brainless", "hopeless", "incompetent", "ignorant",
  "lazy", "dull",
]);

// Second person pronouns (English + Hinglish)
const SECOND_PERSON = new Set([
  "you", "u", "ur", "your", "you're", "youre",
  "tu", "tum", "tera", "teri", "tumhara", "tumhari",
  "aap", "aapka", "aapki",
]);

// Possessive/demonstrative that target content
const CONTENT_TARGETING = new Set([
  "your", "ur", "the", "this", "that", "these", "those",
  "tera", "tumhara", "tumhari", "aapka", "aapki",
]);

/**
 * Analyze message context to distinguish academic discussion from personal attacks.
 * 
 * Examples:
 * - "Your answer is wrong" → ALLOW (academic critique)
 * - "You are stupid" → BLOCK (personal attack)
 * - "This solution is terrible" → ALLOW (critique of content)
 * - "Your code is dumb" → SOFT_WARN (borderline)
 */
export function analyzeContext(text: string): ContextResult {
  const lower = text.toLowerCase();
  const words = lower.split(/\s+/).map((w) => w.replace(/[.,!?;:'"()]/g, ""));

  // Check each word position for patterns
  for (let i = 0; i < words.length; i++) {
    const word = words[i];

    // Pattern 1: Direct 2nd-person + insult → BLOCK
    // "You are stupid", "You're an idiot", "Tu gadha hai"
    if (SECOND_PERSON.has(word) && !CONTENT_TARGETING.has(word)) {
      // Look ahead 1-4 tokens for personal insult
      for (let j = i + 1; j < Math.min(i + 5, words.length); j++) {
        if (PERSONAL_INSULTS.has(words[j])) {
          return {
            action: ContextAction.BLOCK,
            reason: `Personal attack detected: "${word} ... ${words[j]}"`,
            target: "person",
          };
        }
      }
    }

    // Pattern 2: Content targeting + academic object + critique → ALLOW
    // "Your answer is wrong", "The solution is flawed"
    if (CONTENT_TARGETING.has(word)) {
      const nextWord = words[i + 1];
      if (nextWord && ACADEMIC_OBJECTS.has(nextWord)) {
        // Check rest of sentence for critique words
        for (let j = i + 2; j < Math.min(i + 7, words.length); j++) {
          if (CRITIQUE_WORDS.has(words[j])) {
            return {
              action: ContextAction.ALLOW,
              reason: `Academic critique of "${nextWord}"`,
              target: "content",
            };
          }
          // But if personal insult is used on content → SOFT_WARN
          if (PERSONAL_INSULTS.has(words[j])) {
            return {
              action: ContextAction.SOFT_WARN,
              reason: `Impolite phrasing: "${nextWord}" called "${words[j]}"`,
              target: "content",
            };
          }
        }
      }
    }

    // Pattern 3: Academic object + critique without personal target → ALLOW
    if (ACADEMIC_OBJECTS.has(word)) {
      for (let j = i + 1; j < Math.min(i + 4, words.length); j++) {
        if (CRITIQUE_WORDS.has(words[j])) {
          return {
            action: ContextAction.ALLOW,
            reason: `Academic discussion about "${word}"`,
            target: "content",
          };
        }
      }
    }
  }

  // No strong context signal found — return ALLOW by default
  // (pattern matching in the main engine handles clear violations)
  return { action: ContextAction.NEUTRAL };
}

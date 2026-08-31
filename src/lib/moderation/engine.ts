/**
 * Main moderation engine.
 * Orchestrates the full moderation pipeline:
 * normalize → pattern check → context analysis → decision
 */

import { normalizeText, sanitizeForDisplay } from "./normalizer";
import { checkPatterns, getHighestSeverity, type PatternMatch } from "./patterns";
import { analyzeContext, ContextAction } from "./context-analyzer";

export type ModerationDecision = "allow" | "block" | "flag";

export interface ModerationResult {
  decision: ModerationDecision;
  originalText: string;
  sanitizedText: string;
  matches: PatternMatch[];
  severity: "low" | "medium" | "high" | "critical" | null;
  reason: string | null;
  contextOverride: boolean;
}

/**
 * Run the full moderation pipeline on a message.
 * 
 * Pipeline:
 * 1. Sanitize for display (remove control chars)
 * 2. Normalize for matching (homoglyphs, leetspeak, etc.)
 * 3. Run pattern detection (profanity, attacks, threats, etc.)
 * 4. If patterns found, run context analysis
 * 5. Return moderation decision
 * 
 * Performance: < 3ms for typical messages
 */
export function moderateMessage(text: string): ModerationResult {
  const originalText = text;
  const sanitizedText = sanitizeForDisplay(text);
  const normalizedText = normalizeText(text);

  // Step 1: Pattern matching
  const matches = checkPatterns(normalizedText, originalText);

  // No matches → allow
  if (matches.length === 0) {
    return {
      decision: "allow",
      originalText,
      sanitizedText,
      matches: [],
      severity: null,
      reason: null,
      contextOverride: false,
    };
  }

  const severity = getHighestSeverity(matches);

  // Critical or high severity with threat/sexual → always block
  if (severity === "critical") {
    return {
      decision: "block",
      originalText,
      sanitizedText,
      matches,
      severity,
      reason: matches.map((m) => m.category).join(", "),
      contextOverride: false,
    };
  }

  // Step 2: Context analysis — check if it's academic discussion
  const context = analyzeContext(sanitizedText);

  // Context says it's academic critique → allow despite pattern match
  if (context.action === ContextAction.ALLOW && severity !== "high") {
    return {
      decision: "allow",
      originalText,
      sanitizedText,
      matches,
      severity,
      reason: context.reason || null,
      contextOverride: true,
    };
  }

  // Context says soft warn → flag for borderline content
  if (context.action === ContextAction.SOFT_WARN) {
    return {
      decision: "flag",
      originalText,
      sanitizedText,
      matches,
      severity,
      reason: context.reason || matches.map((m) => m.category).join(", "),
      contextOverride: false,
    };
  }

  // High severity or context says block → block
  if (severity === "high" || context.action === ContextAction.BLOCK) {
    return {
      decision: "block",
      originalText,
      sanitizedText,
      matches,
      severity,
      reason: context.reason || matches.map((m) => m.category).join(", "),
      contextOverride: false,
    };
  }

  // Medium severity without clear context → block
  if (severity === "medium") {
    return {
      decision: "block",
      originalText,
      sanitizedText,
      matches,
      severity,
      reason: matches.map((m) => m.category).join(", "),
      contextOverride: false,
    };
  }

  // Low severity → flag
  return {
    decision: "flag",
    originalText,
    sanitizedText,
    matches,
    severity,
    reason: matches.map((m) => m.category).join(", "),
    contextOverride: false,
  };
}

// Re-export for convenience
export { type PatternMatch } from "./patterns";
export { ContextAction, type ContextResult } from "./context-analyzer";
export { calculateEscalation, calculateStrikeDecay, isRestrictionExpired } from "./escalation";

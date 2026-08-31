/**
 * Escalation logic for the moderation system.
 * Handles strike tracking, tier progression, and penalty application.
 */

import {
  MAX_STRIKES_BEFORE_SLOW_MODE,
  MAX_STRIKES_BEFORE_RESTRICTION,
  MAX_STRIKES_BEFORE_SUSPENSION,
  RESTRICTION_DURATION_HOURS,
  STRIKE_DECAY_DAYS,
} from "@/lib/constants";
import type { ModerationUserStatus } from "@/types";

export interface EscalationResult {
  newStatus: ModerationUserStatus;
  newStrikes: number;
  restrictionExpiresAt: string | null;
  action: string;
  message: string;
}

/**
 * Determine the escalation result based on current strikes and violation severity.
 */
export function calculateEscalation(
  currentStrikes: number,
  severity: "low" | "medium" | "high" | "critical"
): EscalationResult {
  // Critical violations → immediate suspension
  if (severity === "critical") {
    return {
      newStatus: "suspended",
      newStrikes: currentStrikes + 3,
      restrictionExpiresAt: null, // manual review required
      action: "suspended",
      message:
        "Your account has been suspended due to a serious policy violation. Please contact your school administrator.",
    };
  }

  // Calculate new strike count based on severity
  const strikeIncrement = severity === "high" ? 2 : 1;
  const newStrikes = currentStrikes + strikeIncrement;

  // Determine new status based on total strikes
  if (newStrikes >= MAX_STRIKES_BEFORE_SUSPENSION) {
    return {
      newStatus: "suspended",
      newStrikes,
      restrictionExpiresAt: null,
      action: "suspended",
      message:
        "Your messaging privileges have been suspended due to repeated violations. Contact your teacher or administrator.",
    };
  }

  if (newStrikes >= MAX_STRIKES_BEFORE_RESTRICTION) {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + RESTRICTION_DURATION_HOURS);
    return {
      newStatus: "restricted",
      newStrikes,
      restrictionExpiresAt: expiresAt.toISOString(),
      action: "restricted",
      message: `Your messaging has been temporarily restricted for ${RESTRICTION_DURATION_HOURS} hours. You can still view content and submit assignments.`,
    };
  }

  if (newStrikes >= MAX_STRIKES_BEFORE_SLOW_MODE) {
    return {
      newStatus: "slow_mode",
      newStrikes,
      restrictionExpiresAt: null,
      action: "slow_mode",
      message:
        "Slow mode has been enabled on your account. You can send one message every 30 seconds.",
    };
  }

  // Below threshold — just a warning
  return {
    newStatus: "active",
    newStrikes,
    restrictionExpiresAt: null,
    action: "warning",
    message:
      "Your message was blocked because it may violate community guidelines. Please keep discussions respectful and academic.",
  };
}

/**
 * Check if strikes should decay based on last violation date.
 * Strikes decay by 1 for every STRIKE_DECAY_DAYS of clean behavior.
 */
export function calculateStrikeDecay(
  currentStrikes: number,
  lastViolationAt: string | null
): number {
  if (!lastViolationAt || currentStrikes === 0) return currentStrikes;

  const lastViolation = new Date(lastViolationAt);
  const now = new Date();
  const daysSinceViolation = Math.floor(
    (now.getTime() - lastViolation.getTime()) / (1000 * 60 * 60 * 24)
  );

  const decayAmount = Math.floor(daysSinceViolation / STRIKE_DECAY_DAYS);
  return Math.max(0, currentStrikes - decayAmount);
}

/**
 * Check if a user's restriction has expired.
 */
export function isRestrictionExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  return new Date() > new Date(expiresAt);
}

/**
 * Get user-friendly status description
 */
export function getStatusDescription(status: ModerationUserStatus): string {
  switch (status) {
    case "active":
      return "Active — no restrictions";
    case "slow_mode":
      return "Slow mode — limited message frequency";
    case "restricted":
      return "Restricted — messaging temporarily disabled";
    case "suspended":
      return "Suspended — contact administrator";
    default:
      return "Unknown status";
  }
}

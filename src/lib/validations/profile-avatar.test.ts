import { describe, it, expect } from "vitest";
import { updateProfileSchema, updateAvatarSchema } from "./schemas";
import { isValidPresetId, isValidEmoji, STUDCHAT_PRESETS, APPROVED_EMOJIS } from "@/lib/avatar-presets";

describe("Profile & Avatar Validation System", () => {
  describe("updateProfileSchema", () => {
    it("accepts valid profile updates with bio and display name", () => {
      const valid = {
        full_name: "Tara Singh",
        display_name: "Tara",
        bio: "First year B.Tech ECE student interested in embedded systems and robotics.",
        phone: "+91 98765 43210",
        avatar_type: "preset" as const,
        avatar_preset_id: "preset_quantum_core",
      };

      const result = updateProfileSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("rejects bio longer than 300 characters", () => {
      const invalid = {
        full_name: "Tara Singh",
        bio: "A".repeat(301),
      };

      const result = updateProfileSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("300 characters");
      }
    });

    it("rejects invalid avatar_type", () => {
      const invalid = {
        avatar_type: "external_hacker_avatar",
      };

      const result = updateProfileSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("Avatar Personalization & Security Whitelist", () => {
    it("validates all built-in StudChat studio presets", () => {
      expect(STUDCHAT_PRESETS.length).toBeGreaterThanOrEqual(10);
      for (const preset of STUDCHAT_PRESETS) {
        expect(isValidPresetId(preset.id)).toBe(true);
      }
    });

    it("strictly rejects path traversal or arbitrary preset IDs", () => {
      expect(isValidPresetId("../../etc/passwd")).toBe(false);
      expect(isValidPresetId("malicious_preset")).toBe(false);
      expect(isValidPresetId("https://evil.com/avatar.png")).toBe(false);
    });

    it("validates approved emojis and rejects unapproved emojis", () => {
      expect(isValidEmoji("🎓")).toBe(true);
      expect(isValidEmoji("⚡")).toBe(true);
      expect(isValidEmoji("🧪")).toBe(true);
      expect(isValidEmoji("💩")).toBe(false);
      expect(isValidEmoji("random_text")).toBe(false);
    });

    it("validates updateAvatarSchema for all avatar types", () => {
      const presetTest = updateAvatarSchema.safeParse({
        avatar_type: "preset",
        avatar_preset_id: "preset_quantum_core",
      });
      expect(presetTest.success).toBe(true);

      const emojiTest = updateAvatarSchema.safeParse({
        avatar_type: "emoji",
        avatar_emoji: "🎓",
        avatar_style: "style-electric-blue",
      });
      expect(emojiTest.success).toBe(true);

      const initialsTest = updateAvatarSchema.safeParse({
        avatar_type: "initials",
      });
      expect(initialsTest.success).toBe(true);
    });
  });
});

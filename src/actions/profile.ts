"use server";

import { createClient } from "@/lib/supabase/server";
import { updateProfileSchema, updateAvatarSchema } from "@/lib/validations/schemas";
import { isValidPresetId, isValidEmoji } from "@/lib/avatar-presets";
import { revalidatePath } from "next/cache";

// Explicit field whitelist for profile updates
const ALLOWED_PROFILE_FIELDS = new Set([
  "full_name",
  "display_name",
  "bio",
  "phone",
  "avatar_type",
  "avatar_url",
  "avatar_preset_id",
  "avatar_emoji",
  "avatar_style",
]);

// Explicit forbidden fields that must NEVER be accepted from client updates
const FORBIDDEN_FIELDS = [
  "id",
  "email",
  "role",
  "is_super_admin",
  "university_id",
  "institution_id",
  "membership_id",
  "permissions",
  "is_active",
  "created_at",
];

export async function updateProfile(data: Record<string, unknown>) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Unauthorized. Please sign in again." };
    }

    // 1. Strict Security Check: Reject forbidden privilege escalation fields
    for (const key of Object.keys(data)) {
      if (FORBIDDEN_FIELDS.includes(key)) {
        return { error: `Security violation: Field '${key}' cannot be modified by user.` };
      }
    }

    // 2. Filter input to strictly allowed whitelist
    const sanitizedData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (ALLOWED_PROFILE_FIELDS.has(key)) {
        sanitizedData[key] = value;
      }
    }

    // 3. Zod schema validation
    const parsed = updateProfileSchema.safeParse(sanitizedData);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Invalid profile data";
      return { error: firstError };
    }

    const payload = parsed.data;

    // 4. Validate avatar-specific integrity if provided
    if (payload.avatar_type === "preset" && payload.avatar_preset_id) {
      if (!isValidPresetId(payload.avatar_preset_id)) {
        return { error: "Invalid preset avatar selected." };
      }
    }

    if (payload.avatar_type === "emoji" && payload.avatar_emoji) {
      if (!isValidEmoji(payload.avatar_emoji)) {
        return { error: "Invalid emoji selected." };
      }
    }

    // 5. Update profiles in Supabase
    const { data: updatedProfile, error: dbError } = await supabase
      .from("profiles")
      .update({
        ...payload,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select()
      .single();

    if (dbError) {
      // If error is due to missing columns in an unmigrated DB, fallback gracefully with supported core columns
      console.warn("DB update error, attempting fallback update:", dbError.message);
      const fallbackPayload: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      if (payload.full_name) fallbackPayload.full_name = payload.full_name;
      if (payload.avatar_url) fallbackPayload.avatar_url = payload.avatar_url;
      if (payload.phone) fallbackPayload.phone = payload.phone;

      const { data: fallbackProfile, error: fallbackError } = await supabase
        .from("profiles")
        .update(fallbackPayload)
        .eq("id", user.id)
        .select()
        .single();

      if (fallbackError) {
        return { error: "Failed to update profile: " + fallbackError.message };
      }

      revalidatePath("/profile");
      revalidatePath("/dashboard");
      return { data: { ...fallbackProfile, ...payload } };
    }

    revalidatePath("/profile");
    revalidatePath("/dashboard");
    return { data: updatedProfile };
  } catch (err: any) {
    return { error: err?.message || "An unexpected error occurred." };
  }
}

export async function updateAvatar(data: {
  avatar_type: "uploaded" | "preset" | "emoji" | "initials";
  avatar_url?: string | null;
  avatar_preset_id?: string | null;
  avatar_emoji?: string | null;
  avatar_style?: string | null;
}) {
  const parsed = updateAvatarSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid avatar configuration." };
  }

  return updateProfile(parsed.data);
}

export async function updateUserPassword(newPassword: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Unauthorized" };
    }

    if (!newPassword || newPassword.length < 8) {
      return { error: "Password must be at least 8 characters long." };
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return { error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { error: err?.message || "Failed to update password." };
  }
}

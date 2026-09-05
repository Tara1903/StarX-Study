"use client";

import { useState } from 'react';
import type { Profile, AvatarType } from '@/types';
import { getPresetById, getStyleById } from '@/lib/avatar-presets';
import { getInitials } from '@/lib/utils';

interface UserAvatarProps {
  profile?: Partial<Profile> | null;
  name?: string;
  avatarUrl?: string | null;
  avatarType?: AvatarType;
  avatarPresetId?: string | null;
  avatarEmoji?: string | null;
  avatarStyle?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

const SIZE_CLASSES = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-base font-bold',
  xl: 'w-20 h-20 text-xl font-bold',
  '2xl': 'w-28 h-28 text-3xl font-black',
};

export function UserAvatar({
  profile,
  name,
  avatarUrl,
  avatarType,
  avatarPresetId,
  avatarEmoji,
  avatarStyle,
  size = 'md',
  className = '',
}: UserAvatarProps) {
  const [imgError, setImgError] = useState(false);

  // Resolve active fields from props or profile
  const resolvedType = avatarType || profile?.avatar_type || (avatarUrl || profile?.avatar_url ? 'uploaded' : 'initials');
  const resolvedUrl = avatarUrl !== undefined ? avatarUrl : profile?.avatar_url;
  const resolvedPresetId = avatarPresetId || profile?.avatar_preset_id;
  const resolvedEmoji = avatarEmoji || profile?.avatar_emoji;
  const resolvedStyleId = avatarStyle || profile?.avatar_style;
  const resolvedName = name || profile?.display_name || profile?.full_name || 'User';

  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;
  const initials = getInitials(resolvedName);

  // 1. Uploaded image avatar
  if (resolvedType === 'uploaded' && resolvedUrl && !imgError) {
    return (
      <div className={`relative shrink-0 rounded-full overflow-hidden bg-muted border border-border/70 shadow-sm ${sizeClass} ${className}`}>
        <img
          src={resolvedUrl}
          alt={resolvedName}
          loading="lazy"
          decoding="async"
          onError={() => setImgError(true)}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  // 2. Preset built-in avatar
  if (resolvedType === 'preset' && resolvedPresetId) {
    const preset = getPresetById(resolvedPresetId);
    if (preset) {
      return (
        <div 
          className={`relative shrink-0 rounded-full overflow-hidden border border-border/70 shadow-sm ${sizeClass} ${className}`}
          title={preset.name}
          dangerouslySetInnerHTML={{ __html: preset.svgContent }}
        />
      );
    }
  }

  // 3. Emoji avatar with brand gradient
  if (resolvedType === 'emoji' && resolvedEmoji) {
    const style = getStyleById(resolvedStyleId);
    return (
      <div
        className={`relative shrink-0 rounded-full flex items-center justify-center select-none shadow-md border ${sizeClass} ${className}`}
        style={{
          background: style.gradient,
          borderColor: style.border,
        }}
      >
        <span className="leading-none transform translate-y-[-1px] filter drop-shadow">
          {resolvedEmoji}
        </span>
      </div>
    );
  }

  // 4. Default Initials fallback on brand gradient
  return (
    <div
      className={`relative shrink-0 rounded-full flex items-center justify-center font-bold tracking-tight text-white select-none shadow-sm border border-primary/30 bg-gradient-to-br from-blue-600 via-indigo-600 to-primary ${sizeClass} ${className}`}
    >
      <span>{initials}</span>
    </div>
  );
}

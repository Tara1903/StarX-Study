'use client';

import React from 'react';
import Link from 'next/link';

interface StarXLogoProps {
  variant?: 'header' | 'horizontal' | 'icon' | 'auth';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showProduct?: boolean;
  showTagline?: boolean;
  href?: string;
  className?: string;
}

export function StarXEmblem({
  size = 32,
  className = '',
  glow = false,
}: {
  size?: number;
  className?: string;
  glow?: boolean;
}) {
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative shrink-0 flex items-center justify-center select-none ${className}`}
    >
      <img
        src="/images/starx-emblem.png"
        alt="StarX Emblem"
        width={size}
        height={size}
        className={`w-full h-full object-contain ${
          glow
            ? 'drop-shadow-[0_0_20px_rgba(34,197,94,0.6)]'
            : 'drop-shadow-[0_0_12px_rgba(34,197,94,0.35)]'
        }`}
      />
    </div>
  );
}

export function StarXLogo({
  variant = 'header',
  size = 'md',
  showProduct = true,
  showTagline = false,
  href = '/dashboard',
  className = '',
}: StarXLogoProps) {
  // If explicitly requested as icon only
  if (variant === 'icon') {
    const iconSize = { sm: 24, md: 32, lg: 40, xl: 56 }[size];
    const iconContent = <StarXEmblem size={iconSize} className={className} />;
    if (href) {
      return (
        <Link
          href={href}
          className="flex items-center shrink-0 hover:opacity-95 active:scale-95 transition-all"
        >
          {iconContent}
        </Link>
      );
    }
    return iconContent;
  }

  // Dimension heights for the official horizontal logo
  const heights = {
    sm: 28,
    md: 36,
    lg: 44,
    xl: 56,
  }[size];

  const content = (
    <div className={`relative flex items-center select-none ${className}`}>
      <img
        src="/images/starx-logo-horizontal.png"
        alt="StarX Study - BEYOND TOMORROW"
        style={{ height: heights }}
        className="w-auto object-contain drop-shadow-[0_0_14px_rgba(34,197,94,0.25)]"
      />
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="flex items-center shrink-0 hover:opacity-90 active:scale-95 transition-all"
      >
        {content}
      </Link>
    );
  }

  return content;
}

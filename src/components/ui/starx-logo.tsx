'use client';

import React from 'react';
import Link from 'next/link';

interface StarXLogoProps {
  variant?: 'header' | 'horizontal' | 'icon' | 'auth';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showProduct?: boolean; // Show "Study"
  showTagline?: boolean; // Show "BEYOND TOMORROW"
  href?: string;
  className?: string;
}

export function StarXEmblem({ size = 32, className = '', glow = false }: { size?: number; className?: string; glow?: boolean }) {
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
        className={`w-full h-full object-contain ${glow ? 'drop-shadow-[0_0_20px_rgba(34,197,94,0.6)]' : 'drop-shadow-[0_0_12px_rgba(34,197,94,0.35)]'}`}
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
  // Dimensions per size
  const dimensions = {
    sm: { emblem: 24, starText: 'text-base', studyText: 'text-[10px]', gap: 'gap-2' },
    md: { emblem: 32, starText: 'text-lg', studyText: 'text-xs', gap: 'gap-2.5' },
    lg: { emblem: 40, starText: 'text-2xl', studyText: 'text-xs', gap: 'gap-3' },
    xl: { emblem: 56, starText: 'text-3xl sm:text-4xl', studyText: 'text-sm', gap: 'gap-3.5' },
  }[size];

  const content = (
    <div className={`flex items-center ${dimensions.gap} select-none ${className}`}>
      {/* Approved StarX Star + X Emblem */}
      <StarXEmblem size={dimensions.emblem} />

      {/* Brand Typography */}
      {variant !== 'icon' && (
        <div className="flex flex-col">
          <div className="flex items-center leading-none">
            <span className={`font-bold tracking-tight text-white ${dimensions.starText}`}>
              Star<span className="bg-gradient-to-r from-[#16A34A] via-[#22C55E] to-[#34D399] bg-clip-text text-transparent">X</span>
            </span>
            {showProduct && (
              <span className={`font-semibold text-[#86EFAC] tracking-wider uppercase ml-1.5 px-1.5 py-0.5 rounded bg-[#16A34A]/15 border border-[#16A34A]/30 ${dimensions.studyText}`}>
                Study
              </span>
            )}
          </div>

          {showTagline && (
            <span className="text-[9px] tracking-[0.25em] text-[#A7B3AA] uppercase font-medium mt-1">
              BEYOND TOMORROW
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="flex items-center shrink-0 hover:opacity-95 active:scale-95 transition-all">
        {content}
      </Link>
    );
  }

  return content;
}

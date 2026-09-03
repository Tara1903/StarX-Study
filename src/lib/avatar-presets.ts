// ============================================
// StudChat Curated Avatar Presets & Emojis
// 100% Original, Zero External Copyrights
// ============================================

export interface AvatarPreset {
  id: string;
  name: string;
  category: 'minimal' | 'academic' | 'tech' | 'abstract' | 'creative';
  accent: string;
  svgContent: string;
}

export interface AvatarStyle {
  id: string;
  name: string;
  className: string;
  gradient: string;
  border: string;
}

// Approved StudChat Emojis
export const APPROVED_EMOJIS = [
  '🎓', '📚', '💻', '🧠', '⚡', '🧪', 
  '📐', '🎨', '🚀', '☕', '🎮', '📖', 
  '🔬', '🔭', '💡', '🛡️', '⚙️', '🌌',
  '🏆', '🎯', '✨', '🔥', '🧩', '🎧'
] as const;

export type ApprovedEmoji = (typeof APPROVED_EMOJIS)[number];

// Approved StudChat Brand Styles for Emoji Avatars
export const APPROVED_AVATAR_STYLES: AvatarStyle[] = [
  {
    id: 'style-electric-blue',
    name: 'Electric Blue',
    className: 'from-blue-600 to-cyan-500 text-white',
    gradient: 'linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)',
    border: '#38BDF8',
  },
  {
    id: 'style-deep-navy',
    name: 'Deep Navy',
    className: 'from-slate-900 via-indigo-950 to-blue-900 text-white',
    gradient: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #1E3A8A 100%)',
    border: '#60A5FA',
  },
  {
    id: 'style-cosmic-purple',
    name: 'Cosmic Purple',
    className: 'from-purple-700 to-indigo-900 text-white',
    gradient: 'linear-gradient(135deg, #7E22CE 0%, #312E81 100%)',
    border: '#C084FC',
  },
  {
    id: 'style-neon-cyan',
    name: 'Neon Cyan',
    className: 'from-cyan-600 via-teal-700 to-emerald-800 text-white',
    gradient: 'linear-gradient(135deg, #0891B2 0%, #0F766E 50%, #065F46 100%)',
    border: '#2DD4BF',
  },
  {
    id: 'style-emerald-circuit',
    name: 'Emerald Matrix',
    className: 'from-emerald-600 to-teal-900 text-white',
    gradient: 'linear-gradient(135deg, #059669 0%, #134E4A 100%)',
    border: '#34D399',
  },
  {
    id: 'style-sunset-amber',
    name: 'Solar Flare',
    className: 'from-amber-600 via-orange-600 to-rose-700 text-white',
    gradient: 'linear-gradient(135deg, #D97706 0%, #EA580C 50%, #BE123C 100%)',
    border: '#FB923C',
  },
];

// Curated Studio Presets
export const STUDCHAT_PRESETS: AvatarPreset[] = [
  {
    id: 'preset_quantum_core',
    name: 'Quantum Core',
    category: 'tech',
    accent: '#06B6D4',
    svgContent: `
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
        <rect width="100" height="100" fill="#0B1329"/>
        <circle cx="50" cy="50" r="32" stroke="#06B6D4" stroke-width="3" stroke-dasharray="6 4" opacity="0.8"/>
        <circle cx="50" cy="50" r="22" stroke="#3B82F6" stroke-width="2"/>
        <circle cx="50" cy="50" r="12" fill="url(#qc_grad)"/>
        <circle cx="50" cy="50" r="5" fill="#FFFFFF"/>
        <defs>
          <linearGradient id="qc_grad" x1="38" y1="38" x2="62" y2="62" gradientUnits="userSpaceOnUse">
            <stop stop-color="#00F0FF"/>
            <stop offset="1" stop-color="#3B82F6"/>
          </linearGradient>
        </defs>
      </svg>
    `,
  },
  {
    id: 'preset_circuit_mesh',
    name: 'Circuit Mesh',
    category: 'tech',
    accent: '#3B82F6',
    svgContent: `
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
        <rect width="100" height="100" fill="#0A0F1D"/>
        <path d="M20 50H40L50 30L60 70L70 50H80" stroke="#3B82F6" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="20" cy="50" r="4" fill="#60A5FA"/>
        <circle cx="80" cy="50" r="4" fill="#60A5FA"/>
        <circle cx="50" cy="30" r="3" fill="#93C5FD"/>
        <circle cx="60" cy="70" r="3" fill="#93C5FD"/>
      </svg>
    `,
  },
  {
    id: 'preset_scholar_crest',
    name: 'Scholar Crest',
    category: 'academic',
    accent: '#8B5CF6',
    svgContent: `
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
        <rect width="100" height="100" fill="#171026"/>
        <path d="M50 24L78 38L50 52L22 38L50 24Z" fill="url(#sc_grad)"/>
        <path d="M32 46V64C32 70 50 76 50 76C50 76 68 70 68 64V46" stroke="#C084FC" stroke-width="3" stroke-linecap="round"/>
        <defs>
          <linearGradient id="sc_grad" x1="22" y1="24" x2="78" y2="52" gradientUnits="userSpaceOnUse">
            <stop stop-color="#A855F7"/>
            <stop offset="1" stop-color="#6366F1"/>
          </linearGradient>
        </defs>
      </svg>
    `,
  },
  {
    id: 'preset_nebula_prism',
    name: 'Nebula Prism',
    category: 'abstract',
    accent: '#EC4899',
    svgContent: `
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
        <rect width="100" height="100" fill="#1C0E24"/>
        <polygon points="50,18 82,78 18,78" stroke="url(#np_grad)" stroke-width="4"/>
        <polygon points="50,30 72,72 28,72" fill="url(#np_grad2)" opacity="0.6"/>
        <circle cx="50" cy="54" r="8" fill="#FFFFFF"/>
        <defs>
          <linearGradient id="np_grad" x1="18" y1="18" x2="82" y2="78" gradientUnits="userSpaceOnUse">
            <stop stop-color="#F43F5E"/>
            <stop offset="1" stop-color="#8B5CF6"/>
          </linearGradient>
          <linearGradient id="np_grad2" x1="28" y1="30" x2="72" y2="72" gradientUnits="userSpaceOnUse">
            <stop stop-color="#FB7185"/>
            <stop offset="1" stop-color="#C084FC"/>
          </linearGradient>
        </defs>
      </svg>
    `,
  },
  {
    id: 'preset_geometric_minimal',
    name: 'Geometric Monolith',
    category: 'minimal',
    accent: '#10B981',
    svgContent: `
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
        <rect width="100" height="100" fill="#0A1815"/>
        <rect x="28" y="28" width="44" height="44" rx="10" stroke="#10B981" stroke-width="3" transform="rotate(45 50 50)"/>
        <circle cx="50" cy="50" r="8" fill="#34D399"/>
      </svg>
    `,
  },
  {
    id: 'preset_aurora_wave',
    name: 'Aurora Sine',
    category: 'academic',
    accent: '#00F0FF',
    svgContent: `
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
        <rect width="100" height="100" fill="#071926"/>
        <path d="M15 65C30 35 45 75 60 45C75 15 90 55 90 55" stroke="#00F0FF" stroke-width="4" stroke-linecap="round"/>
        <path d="M15 75C30 45 45 85 60 55C75 25 90 65 90 65" stroke="#3B82F6" stroke-width="2" opacity="0.6" stroke-linecap="round"/>
        <circle cx="60" cy="45" r="4" fill="#FFFFFF"/>
      </svg>
    `,
  },
  {
    id: 'preset_pulsar_star',
    name: 'Pulsar Star',
    category: 'abstract',
    accent: '#F59E0B',
    svgContent: `
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
        <rect width="100" height="100" fill="#1C1408"/>
        <path d="M50 14L55 38L78 30L62 48L86 50L62 52L78 70L55 62L50 86L45 62L22 70L38 52L14 50L38 48L22 30L45 38L50 14Z" fill="url(#star_grad)"/>
        <circle cx="50" cy="50" r="10" fill="#FFFFFF"/>
        <defs>
          <linearGradient id="star_grad" x1="14" y1="14" x2="86" y2="86" gradientUnits="userSpaceOnUse">
            <stop stop-color="#F59E0B"/>
            <stop offset="1" stop-color="#EF4444"/>
          </linearGradient>
        </defs>
      </svg>
    `,
  },
  {
    id: 'preset_binary_matrix',
    name: 'Binary Flux',
    category: 'tech',
    accent: '#22C55E',
    svgContent: `
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
        <rect width="100" height="100" fill="#08140B"/>
        <text x="24" y="38" fill="#22C55E" font-family="monospace" font-size="16" font-weight="bold">1 0</text>
        <text x="48" y="58" fill="#4ADE80" font-family="monospace" font-size="18" font-weight="bold">0 1</text>
        <text x="28" y="78" fill="#86EFAC" font-family="monospace" font-size="16" font-weight="bold">1 1</text>
        <circle cx="75" cy="30" r="3" fill="#22C55E"/>
        <circle cx="25" cy="85" r="3" fill="#22C55E"/>
      </svg>
    `,
  },
  {
    id: 'preset_studio_craft',
    name: 'Studio Craft',
    category: 'creative',
    accent: '#F43F5E',
    svgContent: `
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
        <rect width="100" height="100" fill="#1A0D15"/>
        <circle cx="42" cy="42" r="22" stroke="#F43F5E" stroke-width="3"/>
        <circle cx="58" cy="58" r="22" stroke="#A855F7" stroke-width="3"/>
        <path d="M42 42C48 48 52 52 58 58" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>
      </svg>
    `,
  },
  {
    id: 'preset_vector_zenith',
    name: 'Vector Zenith',
    category: 'minimal',
    accent: '#6366F1',
    svgContent: `
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
        <rect width="100" height="100" fill="#111226"/>
        <circle cx="50" cy="50" r="34" stroke="#4F46E5" stroke-width="2"/>
        <polygon points="50,26 68,64 50,56 32,64" fill="#818CF8"/>
      </svg>
    `,
  },
  {
    id: 'preset_synth_horizon',
    name: 'Synth Horizon',
    category: 'creative',
    accent: '#E11D48',
    svgContent: `
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
        <rect width="100" height="100" fill="#140816"/>
        <path d="M20 54H80" stroke="#FB7185" stroke-width="2"/>
        <path d="M26 62H74" stroke="#E11D48" stroke-width="2"/>
        <path d="M34 70H66" stroke="#9F1239" stroke-width="2"/>
        <circle cx="50" cy="44" r="18" fill="url(#sh_sun)"/>
        <defs>
          <linearGradient id="sh_sun" x1="50" y1="26" x2="50" y2="62" gradientUnits="userSpaceOnUse">
            <stop stop-color="#F43F5E"/>
            <stop offset="1" stop-color="#E11D48"/>
          </linearGradient>
        </defs>
      </svg>
    `,
  },
  {
    id: 'preset_apex_shield',
    name: 'Apex Shield',
    category: 'academic',
    accent: '#38BDF8',
    svgContent: `
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
        <rect width="100" height="100" fill="#0C1524"/>
        <path d="M50 20L74 30V48C74 62 50 78 50 78C50 78 26 62 26 48V30L50 20Z" fill="url(#as_grad)" stroke="#38BDF8" stroke-width="3"/>
        <path d="M42 48L48 54L60 42" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        <defs>
          <linearGradient id="as_grad" x1="26" y1="20" x2="74" y2="78" gradientUnits="userSpaceOnUse">
            <stop stop-color="#0284C7"/>
            <stop offset="1" stop-color="#1E3A8A"/>
          </linearGradient>
        </defs>
      </svg>
    `,
  },
];

export const PRESET_AVATAR_IDS = STUDCHAT_PRESETS.map((p) => p.id);

export function getPresetById(id: string): AvatarPreset | undefined {
  return STUDCHAT_PRESETS.find((p) => p.id === id);
}

export function isValidPresetId(id: string): boolean {
  return STUDCHAT_PRESETS.some((p) => p.id === id);
}

export function isValidEmoji(emoji: string): boolean {
  return (APPROVED_EMOJIS as readonly string[]).includes(emoji);
}

export function getStyleById(styleId?: string | null): AvatarStyle {
  return APPROVED_AVATAR_STYLES.find((s) => s.id === styleId) || APPROVED_AVATAR_STYLES[0];
}

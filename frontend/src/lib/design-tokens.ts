/**
 * Design System Tokens
 * Unified spacing, typography, and component styles
 */

export const spacing = {
  section: {
    xs: 'py-12',
    sm: 'py-16',
    md: 'py-24',
    lg: 'py-32',
    xl: 'py-40',
  },
  container: {
    sm: 'max-w-3xl',
    md: 'max-w-5xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    full: 'max-w-full',
  },
  gap: {
    xs: 'gap-2',
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8',
    xl: 'gap-12',
  },
  padding: {
    card: 'p-6 md:p-8',
    cardLg: 'p-8 md:p-12',
    page: 'px-4 sm:px-6 lg:px-8',
  },
} as const;

export const typography = {
  hero: 'text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight',
  h1: 'text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight',
  h2: 'text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight',
  h3: 'text-xl sm:text-2xl font-semibold',
  h4: 'text-lg sm:text-xl font-semibold',
  body: 'text-base text-gray-400 leading-relaxed',
  bodyLg: 'text-lg md:text-xl text-gray-400 leading-relaxed',
  small: 'text-sm text-gray-500',
  label: 'text-xs font-medium text-gray-400 uppercase tracking-wide',
} as const;

export const effects = {
  card: 'bg-white/[0.03] border border-white/[0.08] rounded-2xl backdrop-blur-sm',
  cardHover: 'hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-300',
  cardGlow: 'hover:shadow-lg hover:shadow-emerald-500/10',
  glass: 'bg-white/[0.02] backdrop-blur-xl border border-white/[0.06]',
  inputFocus: 'focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50',
} as const;

export const colors = {
  primary: {
    base: 'bg-emerald-500',
    hover: 'hover:bg-emerald-600',
    light: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
  },
  surface: {
    base: 'bg-[#0a0a0f]',
    elevated: 'bg-[#0f0f17]',
    card: 'bg-white/[0.03]',
  },
  text: {
    primary: 'text-white',
    secondary: 'text-gray-400',
    muted: 'text-gray-500',
  },
} as const;

// Layout constants
export const layout = {
  navHeight: 'h-16 md:h-20',
  navPadding: 'pt-20 md:pt-24',
  maxWidth: '1200px',
  sidebarWidth: '280px',
} as const;

/**
 * Nirantar Design System Tokens
 * ==============================
 * Core promise: "Your journey, simplified."
 * 
 * Aesthetic: Premium, friendly, trustworthy, modern, Indian, accessible.
 * Palette: Royal Purple (Primary), Lavender (Secondary), Warm Gold (Accent), Light Lavender / White (Backgrounds).
 */

export const tokens = {
  // 1. COLOR PALETTE
  colors: {
    // Primary: Royal Purple
    primary: {
      50: '#FAF5FF',
      100: '#F3E8FF',
      200: '#E9D5FF',
      300: '#D8B4FE',
      400: '#C084FC',
      500: '#A855F7',
      600: '#9333EA',
      700: '#7E22CE', // Royal Purple Main
      800: '#6B21A8', // Royal Purple Deep
      900: '#581C87', // Royal Purple Dark
      950: '#3B0764',
      DEFAULT: '#6B21A8',
    },
    // Secondary: Lavender
    secondary: {
      50: '#FBF9FF', // Surface Background
      100: '#F4F0FF',
      200: '#EDE9FE', // Soft Lavender Card
      300: '#DDD6FE', // Border & Divider
      400: '#C4B5FD',
      500: '#A78BFA',
      600: '#8B5CF6',
      DEFAULT: '#8B5CF6',
    },
    // Accent: Warm Golden Yellow
    accent: {
      50: '#FFFBEB',
      100: '#FEF3C7', // Soft Gold Pill
      200: '#FDE68A',
      300: '#FCD34D',
      400: '#FBBF24',
      500: '#F59E0B', // Warm Gold Main
      600: '#D97706',
      700: '#B45309',
      DEFAULT: '#F59E0B',
    },
    // Backgrounds & Canvas
    background: {
      canvas: '#F8F6FC',      // Very light lavender page background
      card: '#FFFFFF',        // Pure white elevated card
      subtle: '#FAF8FF',      // Very light lavender card tint
      lavenderLight: '#F3EFFE',
      glass: 'rgba(255, 255, 255, 0.92)',
    },
    // Text / Content Neutral
    text: {
      primary: '#1E1B4B',     // Deep Indigo-Black for crisp readability
      secondary: '#475569',   // Slate 600
      muted: '#64748B',       // Slate 500
      disabled: '#94A3B8',    // Slate 400
      inverse: '#FFFFFF',
      onPrimary: '#FFFFFF',
      onAccent: '#78350F',
    },
    // Borders
    border: {
      subtle: '#EDE9FE',
      default: '#E2D9F3',
      focus: '#7E22CE',
      accent: '#FDE68A',
    },
    // Semantic Status
    semantic: {
      success: {
        bg: '#ECFDF5',
        border: '#A7F3D0',
        text: '#065F46',
        main: '#059669',
      },
      warning: {
        bg: '#FFFBEB',
        border: '#FDE68A',
        text: '#92400E',
        main: '#D97706',
      },
      error: {
        bg: '#FEF2F2',
        border: '#FECACA',
        text: '#991B1B',
        main: '#DC2626',
      },
      info: {
        bg: '#EFF6FF',
        border: '#BFDBFE',
        text: '#1E40AF',
        main: '#2563EB',
      },
    },
  },

  // 2. TYPOGRAPHY
  typography: {
    fontFamily: {
      display: '"Outfit", "Plus Jakarta Sans", sans-serif',
      body: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      mono: '"JetBrains Mono", "Courier New", monospace',
    },
    fontSize: {
      '5xl': { size: '3rem', lineHeight: '1.15', weight: '800' },     // 48px Display Hero
      '4xl': { size: '2.25rem', lineHeight: '1.2', weight: '800' },    // 36px Page Titles
      '3xl': { size: '1.875rem', lineHeight: '1.25', weight: '700' },  // 30px Section Headers
      '2xl': { size: '1.5rem', lineHeight: '1.3', weight: '700' },     // 24px Card Headers
      'xl': { size: '1.25rem', lineHeight: '1.4', weight: '600' },     // 20px Subheaders
      'lg': { size: '1.125rem', lineHeight: '1.5', weight: '600' },    // 18px Emphasized Body
      'base': { size: '1rem', lineHeight: '1.5', weight: '400' },       // 16px Standard Body / Inputs
      'sm': { size: '0.875rem', lineHeight: '1.45', weight: '500' },   // 14px Labels / Help Text
      'xs': { size: '0.75rem', lineHeight: '1.4', weight: '600' },     // 12px Micro Badges / PNR
    },
  },

  // 3. SPACING
  spacing: {
    1: '0.25rem',  // 4px
    2: '0.5rem',   // 8px
    3: '0.75rem',  // 12px
    4: '1rem',     // 16px
    5: '1.25rem',  // 20px
    6: '1.5rem',   // 24px
    8: '2rem',     // 32px
    10: '2.5rem',  // 40px
    12: '3rem',    // 48px
    16: '4rem',    // 64px
    20: '5rem',    // 80px
  },

  // 4. BORDER RADIUS (Rounded & Friendly)
  borderRadius: {
    sm: '0.5rem',    // 8px
    md: '0.75rem',   // 12px
    lg: '1rem',      // 16px
    xl: '1.25rem',   // 20px
    '2xl': '1.5rem', // 24px (Standard Cards)
    '3xl': '2rem',   // 32px (Hero Cards & Modals)
    '4xl': '2.5rem', // 40px (Floating Drawers)
    full: '9999px',  // Pill Buttons / Badges
  },

  // 5. SOFT SHADOWS (Subtle Royal Purple & Slate glow)
  shadows: {
    sm: '0 1px 2px 0 rgba(88, 28, 135, 0.05)',
    md: '0 4px 12px -1px rgba(88, 28, 135, 0.08), 0 2px 4px -1px rgba(88, 28, 135, 0.04)',
    lg: '0 10px 25px -3px rgba(88, 28, 135, 0.10), 0 4px 6px -2px rgba(88, 28, 135, 0.05)',
    xl: '0 20px 35px -5px rgba(88, 28, 135, 0.12), 0 8px 10px -6px rgba(88, 28, 135, 0.04)',
    card: '0 4px 20px 0 rgba(107, 33, 168, 0.06), 0 1px 3px 0 rgba(0, 0, 0, 0.04)',
    cardHover: '0 12px 30px -4px rgba(107, 33, 168, 0.14), 0 4px 8px -2px rgba(0, 0, 0, 0.06)',
    primaryButton: '0 4px 16px 0 rgba(107, 33, 168, 0.35)',
    accentButton: '0 4px 16px 0 rgba(245, 158, 11, 0.30)',
  },

  // 6. BUTTON SIZES
  buttons: {
    lg: {
      height: '3.25rem', // 52px
      padding: '0 1.75rem',
      fontSize: '1rem',
      fontWeight: '700',
      borderRadius: '9999px',
    },
    md: {
      height: '2.75rem', // 44px
      padding: '0 1.25rem',
      fontSize: '0.875rem',
      fontWeight: '600',
      borderRadius: '9999px',
    },
    sm: {
      height: '2.25rem', // 36px
      padding: '0 1rem',
      fontSize: '0.8125rem',
      fontWeight: '600',
      borderRadius: '9999px',
    },
  },

  // 7. CARD SIZES & STYLES
  cards: {
    standard: {
      bg: '#FFFFFF',
      border: '1px solid #EDE9FE',
      borderRadius: '1.5rem',
      padding: '1.5rem',
      shadow: '0 4px 20px 0 rgba(107, 33, 168, 0.06)',
    },
    hero: {
      bg: 'linear-gradient(135deg, #FAF5FF 0%, #FFFFFF 50%, #F5F3FF 100%)',
      border: '1px solid #DDD6FE',
      borderRadius: '2rem',
      padding: '2rem',
      shadow: '0 10px 30px -5px rgba(88, 28, 135, 0.08)',
    },
    interactive: {
      bg: '#FFFFFF',
      border: '1.5px solid #EDE9FE',
      borderRadius: '1.25rem',
      padding: '1.25rem',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },

  // 8. TRANSITIONS
  transitions: {
    fast: 'all 0.15s ease-in-out',
    normal: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    smooth: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
    spring: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
} as const;

export type DesignTokens = typeof tokens;
export default tokens;

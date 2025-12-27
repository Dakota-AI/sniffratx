// Sniffr ATX Design System
// Inspired by leading pet apps: Rover, BarkHappy, Wag

export const colors = {
  // Primary - Warm Orange (friendly, energetic, approachable)
  primary: '#F97316',
  primaryLight: '#FED7AA',
  primaryDark: '#EA580C',
  primaryGradientStart: '#F97316',
  primaryGradientEnd: '#FB923C',

  // Secondary - Teal (calming, trust, complements orange beautifully)
  secondary: '#0D9488',
  secondaryLight: '#99F6E4',
  secondaryDark: '#0F766E',

  // Accent - Warm Coral (softer accent, works with orange)
  accent: '#F87171',
  accentLight: '#FECACA',

  // Backgrounds - Warm, inviting (not cold white)
  background: '#FFFBF7',
  backgroundGradientStart: '#FFFBF7',
  backgroundGradientEnd: '#FFF1E6',
  surface: '#FFFFFF',
  surfaceHover: '#FFF7ED',
  surfaceElevated: '#FFFFFF',

  // Text - Warm tones (not pure black)
  textPrimary: '#1C1917',
  textSecondary: '#57534E',
  textMuted: '#A8A29E',
  textInverse: '#FFFFFF',

  // Semantic
  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  info: '#0EA5E9',

  // Borders & Dividers
  border: '#E7E5E4',
  borderLight: '#F5F5F4',
  borderAccent: '#FDBA74',

  // Shadows (for elevation)
  shadow: 'rgba(0, 0, 0, 0.08)',
  shadowDark: 'rgba(0, 0, 0, 0.15)',
  shadowOrange: 'rgba(249, 115, 22, 0.25)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 24,
  xxl: 32,
  hero: 40,
};

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
};

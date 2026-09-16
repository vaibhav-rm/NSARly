/**
 * KINETIC TYPOGRAPHY DESIGN SYSTEM TOKENS
 * NSARly
 */

export const COLORS = {
  // Core palette
  background: '#09090B',
  foreground: '#FAFAFA',
  mutedSurface: '#18181B',
  cardSurface: '#27272A',
  mutedForeground: '#A1A1AA',
  border: '#3F3F46',
  
  // Signature Accent
  acidYellow: '#DFE104',
  accentForeground: '#000000',

  // Attendance Status Colors (High contrast, bold)
  status: {
    safe: '#22C55E',       // Green / Safe
    atRisk: '#F59E0B',     // Amber / Warning
    shortage: '#EF4444',   // Red / Shortage
    cancelled: '#64748B',  // Slate / Not Held
    pending: '#A1A1AA',    // Light Gray / Not Marked
    excused: '#3B82F6',    // Blue / Excused
  },

  // Structural UI
  divider: '#27272A',
  inputBg: '#09090B',
};

export const FONTS = {
  family: {
    display: 'SpaceGrotesk_700Bold',
    body: 'Inter_400Regular',
    bold: 'Inter_700Bold',
    mono: 'Courier',
  },
};

export const BORDERS = {
  thin: 1,
  thick: 2,
  heavy: 4,
  radius: 0, // Kinetic typography relies on sharp 0px corners
  radiusSm: 2,
};

export const SHADOWS = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sharp: {
    shadowColor: '#DFE104',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
};

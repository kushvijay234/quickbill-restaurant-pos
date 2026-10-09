/**
 * ============================================================================
 * FASTBILLO POS - THEME & COLOR SYSTEM
 * ============================================================================
 * 
 * Easily customize colors for buttons, text, headings, paragraphs,
 * backgrounds, and menus in one single place.
 */

// ----------------------------------------------------------------------------
// 1. BRAND COLORS (Main Brand Palette)
// ----------------------------------------------------------------------------
const BRAND = {
  primary: '#308b1eff',      // Main brand green (Buttons, active states, accents)
  primaryDark: '#15804eff',  // Darker shade (Hover/Pressed, deep headers)
  primaryLight: '#4fc279ff', // Lighter shade (Highlights, soft badges)
  primarySoft: '#f0fdf4',    // Very soft tint (Background cards, pill highlights)
  accent: '#a5540dff',       // Secondary accent color
};

// ----------------------------------------------------------------------------
// 2. BUTTON COLORS (Quickly change any button style)
// ----------------------------------------------------------------------------
const BUTTON = {
  background: BRAND.primary,       // Primary button background color
  text: '#ffffff',                 // Primary button text color
  hover: BRAND.primaryDark,        // Button pressed/active color

  secondaryBackground: '#3b82f6',  // Secondary button background
  secondaryText: '#ffffff',        // Secondary button text

  outlineBorder: BRAND.primary,    // Outline button border color
  outlineText: BRAND.primary,      // Outline button text color

  dangerBackground: '#ef4444',     // Delete / Cancel button background
  dangerText: '#ffffff',           // Delete / Cancel button text

  disabledBackground: '#94a3b8',   // Disabled button background
  disabledText: '#ffffff',         // Disabled button text
};

// ----------------------------------------------------------------------------
// 3. HEADING COLORS (Screen titles, section headers, card titles)
// ----------------------------------------------------------------------------
const HEADING = {
  primary: '#111827',     // Main screen title (H1)
  secondary: '#1f2937',   // Section / Card title (H2)
  subheading: '#374151',  // Subsection header (H3)
  accent: BRAND.primary,  // Highlighted brand title
};

// ----------------------------------------------------------------------------
// 4. PARAGRAPH COLORS (Body copy, descriptions, captions)
// ----------------------------------------------------------------------------
const P = {
  color: '#4b5563',       // Standard paragraph body text
  secondary: '#6b7280',   // Secondary paragraph text
  muted: '#9ca3af',       // Captions, timestamps, helper notes
};

// ----------------------------------------------------------------------------
// 5. GENERAL TEXT COLORS
// ----------------------------------------------------------------------------
const TEXT = {
  primary: '#111827',     // High-contrast primary text
  secondary: '#4b5563',   // Medium-contrast body text
  muted: '#9ca3af',       // Low-contrast / placeholder text
  inverse: '#ffffff',     // Text on dark/primary backgrounds
};

// ----------------------------------------------------------------------------
// 6. BACKGROUND COLORS
// ----------------------------------------------------------------------------
const BACKGROUND = {
  main: '#fcfcfcff',        // App screen background
  surface: '#ffffffff',     // Cards, modal surfaces, headers
  card: '#ffffff',        // Item cards, order cards
  subtle: '#f3f4f6',      // Search inputs, badge backgrounds
  modal: '#ffffff',       // Modal sheets and popups
  border: '#e5e7eb',      // Universal border color
};

// ----------------------------------------------------------------------------
// 7. MENU COLORS (Side Drawer Menu & Bottom Navigation Bar)
// ----------------------------------------------------------------------------
const MENU = {
  background: '#ffffff',           // Side menu drawer background
  barBackground: '#ffffff',        // Bottom navigation tab bar background

  itemBackground: '#f8fafc',       // Menu link item background
  itemActiveBackground: '#f0fdf4', // Active/selected menu item background

  text: '#111827',                 // Menu item title text
  activeText: BRAND.primary,       // Active menu item title text
  subText: '#9ca3af',              // Menu subtitle / helper label text

  icon: BRAND.primary,             // Menu item icon color
  activeIcon: BRAND.primary,       // Active tab / menu icon color
  inactiveIcon: '#9ca3af',         // Inactive tab / menu icon color
  iconWrapBackground: '#f0fdf4',   // Rounded pill wrapper behind menu icon
};

// ----------------------------------------------------------------------------
// 8. MASTER COLORS EXPORT (With Light & Dark Theme Mapping)
// ----------------------------------------------------------------------------
export const COLORS = {
  // Brand Tokens
  ...BRAND,

  // Direct Semantic Groups (Easily accessible as COLORS.button, COLORS.menu, etc.)
  button: BUTTON,
  heading: HEADING,
  p: P,
  text: TEXT,
  background: BACKGROUND,
  menu: MENU,

  // Light Theme Configuration (Used by ThemeContext)
  light: {
    background: BACKGROUND.main,
    surface: BACKGROUND.surface,
    surfaceSubtle: BACKGROUND.subtle,
    border: BACKGROUND.border,
    card: BACKGROUND.card,
    text: TEXT.primary,
    textSecondary: TEXT.secondary,
    textMuted: TEXT.muted,
    shadow: '#000000',

    // Semantic helpers in theme
    button: BUTTON,
    heading: HEADING,
    p: P,
    menu: MENU,
  },

  // Dark Theme Configuration (Used by ThemeContext)
  dark: {
    background: '#0c0923ff',
    surface: '#0f0724ff',
    surfaceSubtle: '#334155',
    border: '#334155',
    card: '#0a3b8aff',
    text: '#f8fafc',
    textSecondary: '#cbd5e1',
    textMuted: '#94a3b8',
    shadow: '#000000',

    // Semantic helpers in dark theme
    button: {
      ...BUTTON,
      text: '#ffffff',
    },
    heading: {
      primary: '#f8fafc',
      secondary: '#f1f5f9',
      subheading: '#e2e8f0',
      accent: BRAND.primaryLight,
    },
    p: {
      color: '#cbd5e1',
      secondary: '#94a3b8',
      muted: '#64748b',
    },
    menu: {
      background: '#1e293b',
      barBackground: '#1e293b',
      itemBackground: '#334155ff',
      itemActiveBackground: '#064e3b',
      text: '#f8fafc',
      activeText: '#34d399',
      subText: '#94a3b8',
      icon: BRAND.primaryLight,
      activeIcon: BRAND.primaryLight,
      inactiveIcon: '#94a3b8',
      iconWrapBackground: '#064e3b',
    },
  },

  // Functional Status Badges & Alerts
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',

  // Payment Method Colors
  cash: '#10b981',
  upi: '#8b5cf6',
  card: BRAND.primary,
};

export default COLORS;

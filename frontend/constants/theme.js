// constants/theme.js — Premium Design System for Rural Health Connect
import { Platform } from 'react-native';

// ─── Color Palette ────────────────────────────────────────────────────────────
export const PALETTE = {
    // Blues
    blue50: '#EFF6FF', blue100: '#DBEAFE', blue200: '#BFDBFE',
    blue500: '#3B82F6', blue600: '#2563EB', blue700: '#1D4ED8',
    blue900: '#1E3A5F',
    // Greens
    green50: '#F0FDF4', green100: '#DCFCE7', green500: '#22C55E', green600: '#16A34A',
    // Ambers
    amber50: '#FFFBEB', amber100: '#FEF3C7', amber500: '#F59E0B', amber600: '#D97706',
    // Reds
    red50: '#FEF2F2', red100: '#FEE2E2', red500: '#EF4444', red600: '#DC2626',
    // Purples
    purple50: '#F5F3FF', purple500: '#8B5CF6', purple600: '#7C3AED',
    // Cyans
    cyan50: '#ECFEFF', cyan500: '#06B6D4',
    // Orange
    orange50: '#FFF7ED', orange500: '#F97316', orange600: '#EA580C',
    // Neutral
    gray50: '#F9FAFB', gray100: '#F3F4F6', gray200: '#E5E7EB',
    gray300: '#D1D5DB', gray400: '#9CA3AF', gray500: '#6B7280',
    gray600: '#4B5563', gray700: '#374151', gray800: '#1F2937',
    gray900: '#111827',
    // Sidebar
    nav900: '#0B1629',
    nav800: '#0F1F3D',
    nav700: '#162440',
    navActive: '#1E40AF',
    navText: '#94A3B8',
    navTextActive: '#FFFFFF',
    navBorder: '#1E293B',
    white: '#FFFFFF',
};

// ─── Semantic Colors ──────────────────────────────────────────────────────────
export const COLORS = {
    // Brand
    primary: PALETTE.blue600,
    primaryDark: PALETTE.blue700,
    primaryLight: PALETTE.blue50,
    accent: PALETTE.green500,

    // Backgrounds
    bgPage: '#F0F4F8',
    bgCard: PALETTE.white,
    bgInput: PALETTE.gray50,

    // Text
    text: PALETTE.gray900,
    textMedium: PALETTE.gray700,
    textSecond: PALETTE.gray500,
    textLight: PALETTE.gray400,
    textInverse: PALETTE.white,

    // Borders
    border: PALETTE.gray200,
    borderFocus: PALETTE.blue500,

    // Status
    statusCritical: PALETTE.red600,
    statusHigh: PALETTE.orange600,
    statusMedium: PALETTE.amber600,
    statusLow: PALETTE.green600,
};

// ─── Priority Semantic ────────────────────────────────────────────────────────
export const PRIORITY = {
    critical: { text: PALETTE.white, bg: PALETTE.red600, border: PALETTE.red600 },
    high: { text: PALETTE.orange600, bg: PALETTE.orange50, border: '#FED7AA' },
    medium: { text: PALETTE.amber600, bg: PALETTE.amber50, border: PALETTE.amber100 },
    low: { text: PALETTE.green600, bg: PALETTE.green50, border: PALETTE.green100 },
};

export const STATUS = {
    submitted: { label: 'Complaint Filed', text: PALETTE.amber600, bg: PALETTE.amber50, border: PALETTE.amber100 },
    assigned: { label: 'Doctor Assigned', text: PALETTE.blue600, bg: PALETTE.blue50, border: PALETTE.blue100 },
    visited: { label: 'Patient Visited', text: PALETTE.purple600, bg: PALETTE.purple50, border: '#DDD6FE' },
    reviewed: { label: 'Under Review', text: PALETTE.cyan500, bg: PALETTE.cyan50, border: '#A5F3FC' },
    treated: { label: 'Treatment Done', text: PALETTE.green600, bg: PALETTE.green50, border: PALETTE.green100 },
    followup: { label: 'Follow-up', text: PALETTE.orange500, bg: PALETTE.orange50, border: '#FED7AA' },
    closed: { label: 'Closed', text: PALETTE.gray500, bg: PALETTE.gray50, border: PALETTE.gray200 },
};

// ─── Stat Card Icons ──────────────────────────────────────────────────────────
export const STAT_ICONS = {
    totalCases: { icon: 'clipboard', iconColor: PALETTE.blue600, iconBg: PALETTE.blue50 },
    activeCases: { icon: 'activity', iconColor: PALETTE.amber500, iconBg: PALETTE.amber50 },
    critical: { icon: 'alert-triangle', iconColor: PALETTE.red600, iconBg: PALETTE.red50 },
    doctors: { icon: 'grid', iconColor: PALETTE.green600, iconBg: PALETTE.green50 },
    villages: { icon: 'map-pin', iconColor: PALETTE.green600, iconBg: PALETTE.green50 },
};

// ─── Spacing Scale ────────────────────────────────────────────────────────────
export const SPACING = {
    xs: 4, sm: 8, md: 12, base: 16, lg: 20, xl: 24, '2xl': 32, '3xl': 40,
};

// ─── Border Radius ────────────────────────────────────────────────────────────
export const RADIUS = {
    sm: 6, md: 10, lg: 14, xl: 18, pill: 999,
};

// ─── Shadow Presets (Platform-aware) ────────────────────────────────────────
export const SHADOW = {
    sm: Platform.select({
        web: { boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
        default: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 1 },
    }),
    md: Platform.select({
        web: { boxShadow: '0 2px 10px rgba(15,23,42,0.08)' },
        default: { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 3 },
    }),
    lg: Platform.select({
        web: { boxShadow: '0 4px 20px rgba(15,23,42,0.10)' },
        default: { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.10, shadowRadius: 20, elevation: 5 },
    }),
};

// ─── Typography ───────────────────────────────────────────────────────────────
export const TYPE = {
    h1: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5, color: COLORS.text },
    h2: { fontSize: 22, fontWeight: '700', letterSpacing: -0.3, color: COLORS.text },
    h3: { fontSize: 16, fontWeight: '700', color: COLORS.text },
    h4: { fontSize: 14, fontWeight: '600', color: COLORS.textMedium },
    body: { fontSize: 14, fontWeight: '400', color: COLORS.textMedium },
    bodySmall: { fontSize: 12.5, fontWeight: '400', color: COLORS.textSecond },
    label: { fontSize: 10.5, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, color: COLORS.textSecond },
    caption: { fontSize: 11, fontWeight: '400', color: COLORS.textLight },
};

// Named exports only — no default export to avoid Metro bundler conflicts

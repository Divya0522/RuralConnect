import { Platform } from 'react-native';

export const CLR = {
    // ── Primary: Indigo / Violet (matches Login page) ──────────────
    primary: '#6366F1',         // Indigo 500
    primaryLight: '#818CF8',    // Indigo 400
    primaryDark: '#4F46E5',     // Indigo 600
    primaryGradient: ['#4F46E5', '#6366F1'], // Login button gradient

    // ── Brand accent for tinted surfaces ───────────────────────────
    primaryTint: '#EEF2FF',     // Indigo 50 (chip bg, icon circles)
    primaryBorder: 'rgba(99,102,241,0.25)',

    // ── Sidebar / shell background ─────────────────────────────────
    sidebarBg: '#0F172A',       // Navy 950 (matches Login root bg)
    sidebarActive: 'rgba(99,102,241,0.18)',
    sidebarText: '#94A3B8',     // muted on dark
    sidebarTextActive: '#A5B4FC', // indigo-300 on dark sidebar

    // ── Semantic ───────────────────────────────────────────────────
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    critical: '#7F1D1D',

    // ── Surface & text ─────────────────────────────────────────────
    bg: '#F8FAFC',
    card: '#FFFFFF',
    cardGlass: 'rgba(255, 255, 255, 0.85)',

    textPri: '#0F172A',         // Navy — stronger heading contrast
    textSec: '#64748B',
    textMuted: '#94A3B8',

    border: '#E2E8F0',
    borderLight: '#F1F5F9',

    // ── Status Tints (saturation tuned for indigo theme) ───────────
    status: {
        NEW: { bg: '#F1F5F9', txt: '#64748B', dot: '#94A3B8' },
        ASSIGNED: { bg: '#EEF2FF', txt: '#4338CA', dot: '#6366F1' },
        DIAGNOSED: { bg: '#F0FDF4', txt: '#166534', dot: '#22C55E' },
        FOLLOWUP: { bg: '#FFFBEB', txt: '#92400E', dot: '#F59E0B' },
        ESCALATED: { bg: '#FEF2F2', txt: '#991B1B', dot: '#EF4444' },
        SPECIALIST_REVIEW: { bg: '#F5F3FF', txt: '#5B21B6', dot: '#8B5CF6' },
        RESOLVED: { bg: '#ECFDF5', txt: '#065F46', dot: '#10B981' },
        CLOSED: { bg: '#F8FAFC', txt: '#475569', dot: '#64748B' },
    }
};

export const SP = {
    xs: 4,
    sm: 8,
    md: 12,
    base: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
};

export const TY = {
    h1: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
    h2: { fontSize: 22, fontWeight: '700', letterSpacing: -0.3 },
    h3: { fontSize: 18, fontWeight: '600' },
    body: { fontSize: 15, fontWeight: '400' },
    bodySemi: { fontSize: 15, fontWeight: '600' },
    caption: { fontSize: 13, fontWeight: '500' },
    small: { fontSize: 12, fontWeight: '400' },
};

export const SHADOW = {
    sm: Platform.select({
        web: { boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' },
        default: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 }
    }),
    md: Platform.select({
        web: { boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' },
        default: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 3 }
    }),
    lg: Platform.select({
        web: { boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' },
        default: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 15, elevation: 5 }
    }),
};

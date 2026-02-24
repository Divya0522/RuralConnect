/**
 * app/dashboard/patient.jsx
 * STRICT REDESIGN — Typography, Spacing, Color tokens applied exactly as specified.
 * All constants are INLINED (no cross-module StyleSheet references) to prevent
 * Metro bundler SSR initialization crashes.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, Pressable,
    TextInput, ActivityIndicator, RefreshControl, Platform,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useAuth } from '../../context/AuthContext';
import { caseService, patientService, villageService, notificationService, diagnosisService } from '../../services/api';
import { StatCardSkeleton, CaseRowSkeleton, SkeletonBox } from '../../components/ui/Skeleton';

// ─── GLOBAL COLOR TOKENS ─────────────────────────────────────────────────────
const CLR = {
    primary: '#2563EB',
    primaryDk: '#1D4ED8',
    success: '#22C55E',
    warning: '#F59E0B',
    danger: '#EF4444',
    bg: '#F8FAFC',
    card: '#FFFFFF',
    textPri: '#111827',
    textSec: '#6B7280',
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
    // Sidebar
    sidebarBg: '#0F172A',
    sidebarAct: '#1E40AF',
    sidebarTxt: '#94A3B8',
    sidebarDiv: '#1E293B',
    // Badge bg tints
    primBg: '#EFF6FF', primBorder: '#BFDBFE',
    warnBg: '#FFFBEB', warnBorder: '#FDE68A',
    danBg: '#FEF2F2', danBorder: '#FECACA',
    sucBg: '#F0FDF4', sucBorder: '#BBF7D0',
    purBg: '#F5F3FF', purTxt: '#7C3AED', purBorder: '#DDD6FE',
    cyanBg: '#ECFEFF', cyanTxt: '#0891B2', cyanBorder: '#A5F3FC',
    grayBg: '#F9FAFB', grayBorder: '#E5E7EB',
    orangeTxt: '#EA580C', orangeBg: '#FFF7ED', orangeBorder: '#FED7AA',
};

// ─── TYPOGRAPHY TOKENS (exact mandatory scale) ────────────────────────────────
const TY = {
    pageTitle: { fontSize: 28, fontWeight: '700', color: CLR.textPri, letterSpacing: -0.4 },
    sectionTitle: { fontSize: 20, fontWeight: '600', color: CLR.textPri },
    cardNumber: { fontSize: 26, fontWeight: '700', color: CLR.textPri, letterSpacing: -0.5 },
    cardLabel: { fontSize: 14, fontWeight: '500', color: CLR.textSec },
    body: { fontSize: 15, fontWeight: '400', color: CLR.textPri },
    bodyMuted: { fontSize: 15, fontWeight: '400', color: CLR.textSec },
    sidebarLabel: { fontSize: 15, fontWeight: '500', color: CLR.sidebarTxt },
    badge: { fontSize: 13, fontWeight: '600' },
};

// ─── SPACING TOKENS (8px grid) ────────────────────────────────────────────────
const SP = {
    xs: 4,   // 0.5×
    sm: 8,   // 1×
    md: 12,  // 1.5×
    base: 16,  // 2×  ← list row vertical padding
    lg: 20,  // 2.5× ← card padding, grid gap
    xl: 24,  // 3×  ← page padding, section gap
    xxl: 32,  // 4×
    xxxl: 40,  // 5×
};

// ─── PLATFORM-AWARE SHADOW (no deprecated shadow* on web) ─────────────────────
const shadow = (lvl = 'sm') => {
    const isWeb = Platform.OS === 'web';
    const map = {
        sm: isWeb
            ? { boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)' }
            : { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: 2 },
        md: isWeb
            ? { boxShadow: '0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)' }
            : { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
        lg: isWeb
            ? { boxShadow: '0 8px 24px rgba(0,0,0,0.10), 0 4px 8px rgba(0,0,0,0.04)' }
            : { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.10, shadowRadius: 24, elevation: 7 },
    };
    return map[lvl] || map.sm;
};

// ─── PRIORITY MAP (soft tinted, no borders, dot indicator) ──────────────────────
const PRI_MAP = {
    critical: { label: 'Critical', txt: '#B91C1C', bg: '#FEF2F2', dot: '#EF4444' },
    high: { label: 'High', txt: '#C2410C', bg: '#FFF7ED', dot: '#F97316' },
    medium: { label: 'Medium', txt: '#B45309', bg: '#FEFCE8', dot: '#F59E0B' },
    low: { label: 'Low', txt: '#15803D', bg: '#F0FDF4', dot: '#22C55E' },
};

// ─── STATUS MAP (soft tinted, no borders) ────────────────────────────────────
const STS_MAP = {
    submitted: { label: 'Complaint Filed', txt: '#6B7280', bg: '#F9FAFB', dot: '#9CA3AF' },
    assigned: { label: 'Doctor Assigned', txt: '#4338CA', bg: '#EEF2FF', dot: '#6366F1' },
    visited: { label: 'Patient Visited', txt: '#7C3AED', bg: '#F5F3FF', dot: '#8B5CF6' },
    reviewed: { label: 'Under Review', txt: '#1D4ED8', bg: '#EFF6FF', dot: '#3B82F6' },
    treated: { label: 'Treatment Done', txt: '#15803D', bg: '#F0FDF4', dot: '#22C55E' },
    followup: { label: 'Follow-up', txt: '#C2410C', bg: '#FFF7ED', dot: '#F97316' },
    closed: { label: 'Closed', txt: '#6B7280', bg: '#F1F5F9', dot: '#94A3B8' },
};

const AVATAR_POOL = [
    { bg: '#DBEAFE', txt: '#1E40AF' }, { bg: '#FCE7F3', txt: '#9D174D' },
    { bg: '#DCFCE7', txt: '#166534' }, { bg: '#FEF3C7', txt: '#92400E' },
    { bg: '#EDE9FE', txt: '#5B21B6' }, { bg: '#CFFAFE', txt: '#155E75' },
];

const STAT_DEFS = [
    { id: 'total', label: 'Total Cases', icon: 'clipboard', iColor: CLR.primary, iBg: CLR.primBg },
    { id: 'active', label: 'Active Cases', icon: 'activity', iColor: CLR.warning, iBg: CLR.warnBg },
    { id: 'critical', label: 'Critical', icon: 'alert-triangle', iColor: CLR.danger, iBg: CLR.danBg },
    { id: 'doctors', label: 'Doctors', icon: 'grid', iColor: CLR.success, iBg: CLR.sucBg },
];

const WEB = Platform.OS === 'web';
const NO_OUTLINE = WEB ? { outlineStyle: 'none' } : {};

// ═══════════════════════════════════════════════════════════════════════════════
//  PRIMITIVE COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

/** Hover-aware Pressable — no-op onHover on native */
function Btn({ style, activeStyle, onPress, disabled, children }) {
    const [hov, setHov] = useState(false);
    return (
        <Pressable
            onPress={onPress}
            disabled={disabled}
            {...(WEB ? { onHoverIn: () => setHov(true), onHoverOut: () => setHov(false) } : {})}
            style={[style, hov && activeStyle]}
        >
            {children}
        </Pressable>
    );
}

/** AvatarCircle — reusable component */
function AvatarCircle({ name = '?', size = 40, idx = 0, bg, fg }) {
    const c = (bg && fg) ? { bg, txt: fg } : AVATAR_POOL[Math.abs(idx) % AVATAR_POOL.length];
    return (
        <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Text style={{ fontSize: size * 0.38, fontWeight: '700', color: c.txt }}>{name.charAt(0).toUpperCase()}</Text>
        </View>
    );
}

/**
 * StatusBadge — rebuilt from scratch.
 * Pill shape, soft tinted bg, colored dot, no border, inline-flex look.
 */
function StatusBadge({ label, txt, bg, dot }) {
    return (
        <View style={[
            C.badgePill,
            { backgroundColor: bg },
        ]}>
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: dot, marginRight: 5 }} />
            <Text style={{ fontSize: 13, fontWeight: '600', color: txt, lineHeight: 18 }}>{label}</Text>
        </View>
    );
}

function PriBadge({ severity = 'medium' }) {
    const m = PRI_MAP[severity] || PRI_MAP.medium;
    return <StatusBadge label={m.label} txt={m.txt} bg={m.bg} dot={m.dot} />;
}

function StsBadge({ status }) {
    const m = STS_MAP[status] || STS_MAP.submitted;
    return <StatusBadge label={m.label} txt={m.txt} bg={m.bg} dot={m.dot} />;
}

/** PageHeader — each section's top title row */
function PageHeader({ title, subtitle, action, onAction }) {
    return (
        <View style={C.pageHeader}>
            <View>
                <Text style={TY.pageTitle}>{title}</Text>
                {subtitle ? <Text style={[TY.bodyMuted, { marginTop: SP.xs }]}>{subtitle}</Text> : null}
            </View>
            {action && (
                <Btn style={C.ctaBtn} activeStyle={C.ctaBtnHov} onPress={onAction}>
                    <Feather name="file-text" size={16} color="#fff" style={{ marginRight: SP.sm }} />
                    <Text style={C.ctaBtnText}>{action}</Text>
                </Btn>
            )}
        </View>
    );
}

/** DashboardCard — metric stat card */
function DashboardCard({ label, value, icon, iColor, iBg, sub, loading }) {
    if (loading) return <View style={{ flex: 1 }}><StatCardSkeleton /></View>;
    return (
        <Btn style={C.metricCard} activeStyle={C.metricCardHov}>
            <View style={C.metricTop}>
                <View>
                    <Text style={TY.cardLabel}>{label}</Text>
                    <Text style={[TY.cardNumber, { marginTop: SP.xs }]}>{value ?? '—'}</Text>
                </View>
                <View style={[C.metricIcon, { backgroundColor: iBg }]}>
                    <Feather name={icon} size={22} color={iColor} />
                </View>
            </View>
            {sub && (
                <View style={C.metricSub}>
                    <Feather name="trending-up" size={13} color={CLR.success} style={{ marginRight: 5 }} />
                    <Text style={[TY.badge, { color: CLR.success }]}>{sub}</Text>
                </View>
            )}
        </Btn>
    );
}

/** SidebarItem — nav entry with gradient active state on web */
function SidebarItem({ icon, label, active, onPress }) {
    const activeGradient = WEB && active
        ? {
            backgroundImage: 'linear-gradient(90deg, #2563EB 0%, #3B82F6 100%)',
            boxShadow: '0 4px 12px rgba(37,99,235,0.30)'
        }
        : {};
    return (
        <Btn
            style={[C.navItem, active && C.navItemActive, activeGradient]}
            activeStyle={!active ? C.navItemHov : undefined}
            onPress={onPress}
        >
            <Feather name={icon} size={18} color={active ? '#FFFFFF' : '#94A3B8'} />
            <Text style={[C.navLabel, active && C.navLabelActive]}>{label}</Text>
        </Btn>
    );
}

/** DataRow — case row in recent list */
function DataRow({ name, complaint, severity, status, idx, divider, onPress }) {
    return (
        <Btn style={[C.dataRow, divider && C.dataRowDiv]} activeStyle={C.dataRowHov} onPress={onPress}>
            <AvatarCircle name={name} size={44} idx={idx} />
            <View style={C.dataRowMid}>
                <Text style={[TY.body, { fontWeight: '600' }]} numberOfLines={1}>{name}</Text>
                <Text style={[TY.bodyMuted, { fontSize: 13, marginTop: 2 }]} numberOfLines={1}>{complaint}</Text>
            </View>
            <View style={C.dataRowRight}>
                <PriBadge severity={severity} />
                <View style={{ width: SP.sm }} />
                <StsBadge status={status} />
            </View>
        </Btn>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  SIDEBAR
// ═══════════════════════════════════════════════════════════════════════════════
const NAV_ITEMS = [
    { key: 'dashboard', icon: 'home', label: 'Dashboard' },
    { key: 'cases', icon: 'clipboard', label: 'My Cases' },
    { key: 'complaint', icon: 'file-text', label: 'New Complaint' },
];

function Sidebar({ active, onNav, user, onLogout }) {
    const [hovLogout, setHovLogout] = useState(false);
    // Web-only gradient background applied as inline style
    const gradientBg = WEB
        ? { backgroundImage: 'linear-gradient(180deg, #0F172A 0%, #0B1B34 100%)' }
        : { backgroundColor: '#0F172A' };
    // Right-edge depth shadow (web only)
    const rightShadow = WEB
        ? { boxShadow: 'inset -1px 0 0 rgba(255,255,255,0.04), 4px 0 24px rgba(0,0,0,0.25)' }
        : {};

    return (
        <View style={[C.sidebar, gradientBg, rightShadow]}>
            {/* ── Logo header ── */}
            <View style={C.logoArea}>
                <View style={[
                    C.logoMark,
                    WEB && { backgroundImage: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' },
                ]}>
                    <Ionicons name="heart" size={20} color="#fff" />
                </View>
                <View>
                    <Text style={C.logoName}>Rural Health</Text>
                    <Text style={C.logoCon}>CONNECT</Text>
                </View>
            </View>

            {/* ── Navigation ── */}
            <Text style={C.navSection}>NAVIGATION</Text>
            {NAV_ITEMS.map(n => (
                <SidebarItem
                    key={n.key}
                    icon={n.icon}
                    label={n.label}
                    active={active === n.key}
                    onPress={() => onNav(n.key)}
                />
            ))}

            <View style={{ flex: 1 }} />

            {/* ── Profile section ── */}
            <View style={C.userArea}>
                <AvatarCircle name={user?.name} size={40} bg="#2563EB" fg="#fff" />
                <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={C.userName}>{user?.name}</Text>
                    <Text style={C.userRole}>Patient</Text>
                </View>
            </View>

            {/* ── Sign out ── */}
            <Pressable
                style={[C.signOutRow, hovLogout && C.signOutRowHov]}
                onPress={onLogout}
                {...(WEB ? {
                    onHoverIn: () => setHovLogout(true),
                    onHoverOut: () => setHovLogout(false),
                } : {})}
            >
                <Feather name="log-out" size={16}
                    color={hovLogout ? '#FFFFFF' : '#64748B'}
                    style={{ marginRight: 10 }}
                />
                <Text style={[C.signOutTxt, hovLogout && { color: '#FFFFFF' }]}>Sign Out</Text>
            </Pressable>
        </View>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  DIAGNOSIS PANEL (Side view)
// ═══════════════════════════════════════════════════════════════════════════════
function DiagnosisPanel({ caseId, onClose }) {
    const [loading, setLoading] = useState(true);
    const [diag, setDiag] = useState(null);

    useEffect(() => {
        if (!caseId) return;
        setLoading(true);
        diagnosisService.list({ caseId })
            .then(r => setDiag(r.data.data?.[0] || null))
            .catch(() => setDiag(null))
            .finally(() => setLoading(false));
    }, [caseId]);

    if (!caseId) return null;

    return (
        <View style={C.diagPanel}>
            <View style={C.diagHeader}>
                <Text style={[TY.sectionTitle, { fontSize: 18 }]}>Case Details & Diagnosis</Text>
                <Btn onPress={onClose} style={C.closeBtn}>
                    <Feather name="x" size={20} color={CLR.textSec} />
                </Btn>
            </View>

            {loading ? (
                <View style={{ padding: 24 }}><ActivityIndicator color={CLR.primary} /></View>
            ) : !diag ? (
                <View style={C.diagEmpty}>
                    <Feather name="clock" size={40} color={CLR.border} />
                    <Text style={[TY.bodyMuted, { marginTop: 16, textAlign: 'center' }]}>
                        Doctor diagnosis is pending. You will be notified once it's available.
                    </Text>
                </View>
            ) : (
                <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24, gap: 24 }}>
                    <View>
                        <Text style={C.diagLabel}>Final Diagnosis</Text>
                        <Text style={C.diagVal}>{diag.finalDiagnosis}</Text>
                        {diag.icdCode && <Text style={C.diagSub}>ICD-10: {diag.icdCode}</Text>}
                    </View>

                    {diag.prescription?.length > 0 && (
                        <View>
                            <Text style={C.diagLabel}>Prescription</Text>
                            {diag.prescription.map((m, i) => (
                                <View key={i} style={C.prescRow}>
                                    <Feather name="minus" size={12} color={CLR.primary} style={{ marginTop: 4 }} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={[TY.body, { fontWeight: '600' }]}>{m.medicine}</Text>
                                        <Text style={[TY.bodyMuted, { fontSize: 13 }]}>{m.dosage} • {m.frequency} • {m.duration}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}

                    {diag.treatmentPlan && (
                        <View>
                            <Text style={C.diagLabel}>Treatment Plan</Text>
                            <Text style={C.diagVal}>{diag.treatmentPlan}</Text>
                        </View>
                    )}

                    {diag.notes && (
                        <View>
                            <Text style={C.diagLabel}>Doctor's Notes</Text>
                            <Text style={C.diagVal}>{diag.notes}</Text>
                        </View>
                    )}

                    <View style={C.diagFooter}>
                        <View style={C.doctorCard}>
                            <AvatarCircle name={diag.doctor?.name} size={36} bg={CLR.primBg} fg={CLR.primary} />
                            <View style={{ flex: 1 }}>
                                <Text style={[TY.body, { fontWeight: '600', fontSize: 14 }]}>{diag.doctor?.name}</Text>
                                <Text style={[TY.bodyMuted, { fontSize: 12 }]}>{diag.doctor?.qualification || 'Senior Doctor'}</Text>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            )}
        </View>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  DASHBOARD VIEW
// ═══════════════════════════════════════════════════════════════════════════════
function DashboardView({ user, cases, loading, refreshing, onRefresh, onNav, onSelectCase }) {
    const vals = {
        total: cases.length,
        active: cases.filter(c => !['treated', 'closed'].includes(c.status)).length,
        critical: cases.filter(c => c.severity === 'critical').length,
        doctors: [...new Set(cases.filter(c => c.assignedTo?._id).map(c => c.assignedTo._id))].length,
    };

    return (
        <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={C.page}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[CLR.primary]} />}
            showsVerticalScrollIndicator={false}
        >
            {/* Page header */}
            <PageHeader
                title={`Welcome back, ${user?.name?.split(' ')[0] || 'Patient'}`}
                subtitle="Here's your healthcare overview for today"
                action="New Complaint"
                onAction={() => onNav('complaint')}
            />

            {/* Metric cards grid */}
            <View style={C.metricsRow}>
                {STAT_DEFS.map(d => (
                    <DashboardCard
                        key={d.id}
                        label={d.label}
                        value={vals[d.id]}
                        icon={d.icon}
                        iColor={d.iColor}
                        iBg={d.iBg}
                        sub={d.sub}
                        loading={loading}
                    />
                ))}
            </View>

            {/* Recent Cases section */}
            <View style={C.section}>
                <View style={C.sectionHead}>
                    <Text style={TY.sectionTitle}>Recent Cases</Text>
                    <Btn style={C.viewAllBtn} onPress={() => onNav('cases')}>
                        <Text style={C.viewAllTxt}>View All</Text>
                        <Feather name="arrow-right" size={15} color={CLR.primary} style={{ marginLeft: 4 }} />
                    </Btn>
                </View>

                {loading ? (
                    <CaseRowSkeleton count={4} />
                ) : cases.length === 0 ? (
                    <View style={C.emptyBox}>
                        <Feather name="inbox" size={44} color={CLR.border} />
                        <Text style={[TY.sectionTitle, { marginTop: SP.base, color: CLR.textSec }]}>No cases yet</Text>
                        <Text style={[TY.bodyMuted, { marginTop: SP.sm, textAlign: 'center' }]}>Submit your first complaint to get started.</Text>
                        <Btn style={C.emptyActionBtn} activeStyle={{ opacity: 0.85 }} onPress={() => onNav('complaint')}>
                            <Text style={C.emptyActionTxt}>Submit First Complaint</Text>
                        </Btn>
                    </View>
                ) : (
                    cases.slice(0, 5).map((c, i) => (
                        <DataRow
                            key={c._id}
                            name={c.patient?.name || user?.name || 'Unknown'}
                            complaint={c.chiefComplaint}
                            severity={c.severity}
                            status={c.status}
                            idx={i}
                            divider={i < Math.min(cases.length, 5) - 1}
                            onPress={() => onSelectCase(c._id)}
                        />
                    ))
                )}
            </View>
        </ScrollView>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  MY CASES VIEW
// ═══════════════════════════════════════════════════════════════════════════════
function CasesView({ cases, loading, refreshing, onRefresh, onSelectCase }) {
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');
    const [showDD, setShowDD] = useState(false);
    const STS_OPTS = ['all', 'submitted', 'assigned', 'visited', 'reviewed', 'treated', 'closed'];

    const rows = cases.filter(c => {
        const q = search.toLowerCase();
        return (
            (!q || c.chiefComplaint?.toLowerCase().includes(q)
                || c.caseId?.toLowerCase().includes(q)
                || c.patient?.name?.toLowerCase().includes(q))
            && (filter === 'all' || c.status === filter)
        );
    });

    return (
        <View style={{ flex: 1 }}>
            <View style={[C.page, { paddingBottom: 0 }]}>
                <PageHeader title="My Cases" subtitle="Track and manage all your submitted cases" />

                {/* Toolbar */}
                <View style={[C.toolbar, { position: 'relative' }]}>
                    <View style={C.toolSearch}>
                        <Feather name="search" size={15} color={CLR.textSec} style={{ marginRight: SP.sm }} />
                        <TextInput
                            style={[{ flex: 1, ...TY.body, color: CLR.textPri }, NO_OUTLINE]}
                            value={search} onChangeText={setSearch}
                            placeholder="Search cases..." placeholderTextColor={CLR.textSec}
                        />
                        {search.length > 0 && (
                            <Btn onPress={() => setSearch('')}>
                                <Feather name="x" size={14} color={CLR.textSec} />
                            </Btn>
                        )}
                    </View>
                    <Btn style={C.filterBtn} activeStyle={C.filterBtnHov} onPress={() => setShowDD(v => !v)}>
                        <Feather name="filter" size={14} color={CLR.textSec} style={{ marginRight: 6 }} />
                        <Text style={[TY.body, { color: CLR.textPri }]}>
                            {filter === 'all' ? 'All Statuses' : STS_MAP[filter]?.label || filter}
                        </Text>
                        <Feather name={showDD ? 'chevron-up' : 'chevron-down'} size={13} color={CLR.textSec} style={{ marginLeft: 6 }} />
                    </Btn>

                    {showDD && (
                        <View style={C.dropDown}>
                            {STS_OPTS.map(s => (
                                <Btn key={s} style={[C.ddItem, filter === s && C.ddItemActive]} activeStyle={{ backgroundColor: CLR.primBg }}
                                    onPress={() => { setFilter(s); setShowDD(false); }}>
                                    <Text style={[TY.body, { color: filter === s ? CLR.primary : CLR.textPri, fontWeight: filter === s ? '600' : '400' }]}>
                                        {s === 'all' ? 'All Statuses' : STS_MAP[s]?.label || s}
                                    </Text>
                                </Btn>
                            ))}
                        </View>
                    )}
                </View>
            </View>

            {/* Table */}
            <View style={C.tableWrap}>
                {/* Head */}
                <View style={C.tableHead}>
                    {[['ID', 0.5], ['Patient', 1.2], ['Village', 1.0], ['Complaint', 1.9], ['Priority', 0.9], ['Status', 1.3]].map(([h, f]) => (
                        <Text key={h} style={[C.th, { flex: f }]}>{h}</Text>
                    ))}
                </View>

                <ScrollView
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[CLR.primary]} />}
                    showsVerticalScrollIndicator={false}
                >
                    {loading ? (
                        <View style={{ padding: SP.lg, gap: SP.md }}>
                            {[1, 2, 3, 4].map(i => <SkeletonBox key={i} width="100%" height={52} radius={8} />)}
                        </View>
                    ) : rows.length === 0 ? (
                        <View style={C.emptyBox}>
                            <Feather name="search" size={40} color={CLR.border} />
                            <Text style={[TY.sectionTitle, { marginTop: SP.base, color: CLR.textSec }]}>
                                {search ? 'No matching cases' : 'No cases found'}
                            </Text>
                        </View>
                    ) : (
                        rows.map((c, i) => (
                            <Btn key={c._id}
                                style={[C.tableRow, i % 2 === 1 && { backgroundColor: '#FAFAFA' }]}
                                activeStyle={C.tableRowHov}
                                onPress={() => onSelectCase(c._id)}
                            >
                                <Text style={[C.td, { flex: 0.5, color: CLR.primary, fontWeight: '700' }]}>
                                    {c.caseId ? 'C' + c.caseId.replace(/\D/g, '').slice(-3) : `C${String(i + 1).padStart(3, '0')}`}
                                </Text>
                                <View style={{ flex: 1.2, flexDirection: 'row', alignItems: 'center', gap: SP.sm }}>
                                    <AvatarCircle name={c.patient?.name || '?'} size={32} idx={i} />
                                    <Text style={[C.td, { flex: 1, fontWeight: '600', color: '#111827' }]} numberOfLines={2}>{c.patient?.name || 'Me'}</Text>
                                </View>
                                <Text style={[C.td, { flex: 1.0, color: '#9CA3AF', fontSize: 13 }]} numberOfLines={1}>{c.village?.name || '—'}</Text>
                                <Text style={[C.td, { flex: 1.9 }]} numberOfLines={2}>{c.chiefComplaint}</Text>
                                <View style={{ flex: 0.9, justifyContent: 'center' }}><PriBadge severity={c.severity} /></View>
                                <View style={{ flex: 1.3, justifyContent: 'center' }}><StsBadge status={c.status} /></View>
                            </Btn>
                        ))
                    )}
                    <View style={{ height: 40 }} />
                </ScrollView>
            </View>
        </View>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  NEW COMPLAINT VIEW
// ═══════════════════════════════════════════════════════════════════════════════
function ComplaintView({ user, onSuccess }) {
    const [villages, setVillages] = useState([]);
    const [loadingV, setLoadingV] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [openDD, setOpenDD] = useState(null);
    const [form, setForm] = useState({
        name: user?.name || '', phone: user?.phone || '', age: '',
        gender: 'male', village: '', villageName: '', complaint: '', symptoms: '', severity: 'medium',
    });

    useEffect(() => {
        villageService.list({ limit: 100 })
            .then(r => setVillages(r.data.data || []))
            .catch(() => { })
            .finally(() => setLoadingV(false));
    }, []);

    const set = k => v => setForm(f => ({ ...f, [k]: v }));
    const tog = k => setOpenDD(o => o === k ? null : k);

    const submit = async () => {
        if (!form.complaint.trim()) {
            Toast.show({ type: 'error', text1: 'Required', text2: 'Please describe the complaint.' });
            return;
        }
        setSubmitting(true);
        try {
            let pid = null;
            try { pid = (await patientService.me()).data.data?._id; } catch { }
            if (!pid) {
                const r = await patientService.create({
                    name: form.name || user?.name, phone: form.phone || user?.phone,
                    age: parseInt(form.age) || undefined, gender: form.gender,
                    village: form.village || undefined,
                });
                pid = r.data.data._id;
            }
            const fd = new FormData();
            fd.append('patient', pid);
            fd.append('chiefComplaint', form.complaint);
            if (form.village) fd.append('village', form.village);
            if (form.severity) fd.append('severity', form.severity);
            if (form.symptoms) form.symptoms.split(',').map(s => s.trim()).filter(Boolean).forEach(s => fd.append('symptoms', s));
            await caseService.create(fd);
            Toast.show({ type: 'success', text1: '✅ Complaint Submitted!', text2: 'Your case has been registered.' });
            setForm({ name: user?.name || '', phone: '', age: '', gender: 'male', village: '', villageName: '', complaint: '', symptoms: '', severity: 'medium' });
            onSuccess?.();
        } catch (e) {
            Toast.show({ type: 'error', text1: 'Error', text2: e.response?.data?.error || 'Submission failed.' });
        } finally { setSubmitting(false); }
    };

    // Inline field-with-dropdown component
    const SelField = ({ label, ddKey, display, value, placeholder, zIdx, children }) => (
        <View style={[C.field, { zIndex: openDD === ddKey ? 100 : zIdx || 1 }]}>
            <Text style={C.fieldLabel}>{label}</Text>
            <Btn style={[C.input, C.selRow, openDD === ddKey && { borderColor: CLR.primary }]}
                activeStyle={{ borderColor: CLR.textSec }} onPress={() => tog(ddKey)}>
                <Text style={{ ...TY.body, color: value ? CLR.textPri : CLR.textSec }}>{display || placeholder}</Text>
                <Feather name={openDD === ddKey ? 'chevron-up' : 'chevron-down'} size={15} color={CLR.textSec} />
            </Btn>
            {openDD === ddKey && (
                <View style={C.selDD}>
                    <ScrollView style={{ maxHeight: 180 }}>{children}</ScrollView>
                </View>
            )}
        </View>
    );

    return (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={C.page} showsVerticalScrollIndicator={false}>
            <PageHeader title="New Complaint" subtitle="Register a new patient complaint" />

            <View style={C.formCard}>
                {/* Row 1 */}
                <View style={C.fRow}>
                    <View style={[C.field, { flex: 1 }]}>
                        <Text style={C.fieldLabel}>Patient Name</Text>
                        <TextInput style={[C.input, NO_OUTLINE]} value={form.name} onChangeText={set('name')} placeholder="Full name" placeholderTextColor={CLR.textSec} />
                    </View>
                    <View style={[C.field, { flex: 1 }]}>
                        <Text style={C.fieldLabel}>Phone Number</Text>
                        <TextInput style={[C.input, NO_OUTLINE]} value={form.phone} onChangeText={set('phone')} placeholder="+91 XXXXX XXXXX" placeholderTextColor={CLR.textSec} keyboardType="phone-pad" />
                    </View>
                </View>

                {/* Row 2 */}
                <View style={[C.fRow, { zIndex: 60 }]}>
                    <View style={{ flex: 1 }}>
                        <SelField label="Village" ddKey="village" display={form.villageName} value={form.village} placeholder="Select village" zIdx={3}>
                            {loadingV
                                ? <ActivityIndicator color={CLR.primary} style={{ padding: SP.md }} />
                                : villages.length === 0
                                    ? <Text style={C.ddEmpty}>No villages found</Text>
                                    : villages.map(v => (
                                        <Btn key={v._id} style={C.ddItem} activeStyle={{ backgroundColor: CLR.primBg }}
                                            onPress={() => { setForm(f => ({ ...f, village: v._id, villageName: v.name })); setOpenDD(null); }}>
                                            <Text style={[TY.body, { color: CLR.textPri }]}>{v.name}</Text>
                                            {v.district && <Text style={[TY.bodyMuted, { fontSize: 13 }]}>{v.district}</Text>}
                                        </Btn>
                                    ))
                            }
                        </SelField>
                    </View>
                    <View style={[C.field, { flex: 1 }]}>
                        <Text style={C.fieldLabel}>Age</Text>
                        <TextInput style={[C.input, NO_OUTLINE]} value={form.age} onChangeText={set('age')} placeholder="Age in years" placeholderTextColor={CLR.textSec} keyboardType="numeric" />
                    </View>
                </View>

                {/* Row 3 */}
                <View style={[C.fRow, { zIndex: 40 }]}>
                    <View style={{ flex: 1 }}>
                        <SelField label="Gender" ddKey="gender" display={form.gender.charAt(0).toUpperCase() + form.gender.slice(1)} value={form.gender} placeholder="Select" zIdx={2}>
                            {['male', 'female', 'other'].map(g => (
                                <Btn key={g} style={[C.ddItem, form.gender === g && C.ddItemActive]} activeStyle={{ backgroundColor: CLR.primBg }}
                                    onPress={() => { set('gender')(g); setOpenDD(null); }}>
                                    <Text style={[TY.body, { color: form.gender === g ? CLR.primary : CLR.textPri }]}>{g.charAt(0).toUpperCase() + g.slice(1)}</Text>
                                </Btn>
                            ))}
                        </SelField>
                    </View>
                    <View style={{ flex: 1 }}>
                        <SelField label="Severity" ddKey="severity" display={form.severity.charAt(0).toUpperCase() + form.severity.slice(1)} value={form.severity} placeholder="Select" zIdx={2}>
                            {['low', 'medium', 'high', 'critical'].map(sv => (
                                <Btn key={sv} style={[C.ddItem, form.severity === sv && C.ddItemActive]} activeStyle={{ backgroundColor: CLR.primBg }}
                                    onPress={() => { set('severity')(sv); setOpenDD(null); }}>
                                    <Text style={[TY.body, { color: PRI_MAP[sv]?.txtColor === '#FFFFFF' ? CLR.danger : PRI_MAP[sv]?.txtColor }]}>
                                        {sv.charAt(0).toUpperCase() + sv.slice(1)}
                                    </Text>
                                </Btn>
                            ))}
                        </SelField>
                    </View>
                </View>

                {/* Complaint */}
                <View style={[C.field, { zIndex: 1 }]}>
                    <Text style={C.fieldLabel}>Complaint Description</Text>
                    <TextInput style={[C.input, C.textarea, NO_OUTLINE]} value={form.complaint} onChangeText={set('complaint')}
                        placeholder="Describe the main complaint in detail..." placeholderTextColor={CLR.textSec}
                        multiline textAlignVertical="top" />
                </View>

                {/* Symptoms */}
                <View style={[C.field, { zIndex: 1 }]}>
                    <Text style={C.fieldLabel}>
                        Symptoms{'  '}
                        <Text style={[TY.bodyMuted, { fontWeight: '400', fontSize: 13 }]}>(comma separated)</Text>
                    </Text>
                    <TextInput style={[C.input, { height: 80, textAlignVertical: 'top', paddingTop: SP.md }, NO_OUTLINE]}
                        value={form.symptoms} onChangeText={set('symptoms')}
                        placeholder="e.g. fever, headache, fatigue..." placeholderTextColor={CLR.textSec}
                        multiline textAlignVertical="top" />
                </View>

                {/* Upload */}
                <View style={[C.field, { zIndex: 1 }]}>
                    <Text style={C.fieldLabel}>
                        Upload Images{'  '}
                        <Text style={[TY.bodyMuted, { fontWeight: '400', fontSize: 13 }]}>(optional)</Text>
                    </Text>
                    <Btn style={C.uploadBox} activeStyle={{ borderColor: CLR.primary }}>
                        <Feather name="upload" size={30} color={CLR.textSec} />
                        <Text style={[TY.body, { color: CLR.textSec, fontWeight: '500', marginTop: SP.sm }]}>Click to upload or drag and drop</Text>
                        <Text style={[TY.bodyMuted, { fontSize: 13 }]}>PNG, JPG up to 10MB</Text>
                    </Btn>
                </View>

                {/* Actions */}
                <View style={C.actions}>
                    <Btn style={C.submitBtn} activeStyle={C.submitBtnHov} onPress={submit} disabled={submitting}>
                        {submitting
                            ? <ActivityIndicator color="#fff" />
                            : <>
                                <Feather name="file-text" size={17} color="#fff" style={{ marginRight: SP.sm }} />
                                <Text style={C.submitTxt}>Submit Complaint</Text>
                            </>
                        }
                    </Btn>
                    <Btn style={C.cancelBtn} activeStyle={C.cancelBtnHov}
                        onPress={() => setForm({ name: user?.name || '', phone: '', age: '', gender: 'male', village: '', villageName: '', complaint: '', symptoms: '', severity: 'medium' })}>
                        <Text style={C.cancelTxt}>Cancel</Text>
                    </Btn>
                </View>
            </View>
            <View style={{ height: SP.xxxl }} />
        </ScrollView>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  ROOT
// ═══════════════════════════════════════════════════════════════════════════════
export default function PatientDashboard() {
    const { user, logout } = useAuth();
    const [nav, setNav] = useState('dashboard');
    const [cases, setCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selCase, setSelCase] = useState(null);

    const load = useCallback(async () => {
        try {
            const [cr, nr] = await Promise.all([
                caseService.list({ limit: 100 }),
                notificationService.list({ limit: 20 }).catch(() => ({ data: { data: [] } })),
            ]);
            setCases(cr.data.data || []);
        } catch {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to load data.' });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const refresh = () => { setRefreshing(true); load(); };

    return (
        <View style={C.root}>
            <Sidebar active={nav} onNav={setNav} user={user} onLogout={logout} />
            <View style={C.main}>
                <View style={{ flex: 1, flexDirection: 'row' }}>
                    <View style={{ flex: 1 }}>
                        <View style={C.content}>
                            {nav === 'dashboard' && <DashboardView user={user} cases={cases} loading={loading} refreshing={refreshing} onRefresh={refresh} onNav={setNav} onSelectCase={setSelCase} />}
                            {nav === 'cases' && <CasesView cases={cases} loading={loading} refreshing={refreshing} onRefresh={refresh} onSelectCase={setSelCase} />}
                            {nav === 'complaint' && <ComplaintView user={user} onSuccess={() => { setNav('cases'); load(); }} />}
                        </View>
                    </View>
                    <DiagnosisPanel caseId={selCase} onClose={() => setSelCase(null)} />
                </View>
            </View>
        </View>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  STYLES — all values literal (no cross-module constant refs in StyleSheet)
// ═══════════════════════════════════════════════════════════════════════════════
const C = StyleSheet.create({
    // ── Root layout ──────────────────────────────────────────────────────────────
    root: { flex: 1, flexDirection: 'row' },
    main: { flex: 1, flexDirection: 'column' },
    content: { flex: 1, backgroundColor: '#F8FAFC' },
    page: { padding: 24, gap: 24 },

    // ── Sidebar (rebuilt from scratch) ───────────────────────────────────────────────
    sidebar: {
        width: 260,
        paddingHorizontal: 18,
        paddingBottom: 18,
        // Fallback flat color for native; gradient applied inline for web
        backgroundColor: '#0F172A',
    },
    // Logo header row
    logoArea: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingTop: 22,
        paddingBottom: 18,
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.08)',
    },
    // Logo icon tile — gradient applied inline for web, blue fallback for native
    logoMark: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#3B82F6',  // fallback for native
        alignItems: 'center',
        justifyContent: 'center',
    },
    // Brand title — full white, bigger, bolder
    logoName: { fontSize: 18, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.2 },
    // CONNECT subtitle — muted gray, small caps
    logoCon: { fontSize: 12, fontWeight: '500', color: '#9CA3AF', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 2 },
    // Section group label
    navSection: {
        fontSize: 11,
        fontWeight: '600',
        color: '#64748B',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        marginBottom: 12,
        paddingLeft: 4,
    },
    navItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 10,
        marginBottom: 3,
        gap: 12,
    },
    // Active nav item — gradient via inline, soft shadow
    navItemActive: {
        backgroundColor: '#2563EB',     // fallback for native
    },
    navItemHov: { backgroundColor: 'rgba(59,130,246,0.12)' },
    navLabel: { fontSize: 15, fontWeight: '500', color: '#CBD5E1' },
    navLabelActive: { color: '#FFFFFF', fontWeight: '600' },
    // Profile block
    userArea: {
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.08)',
        paddingTop: 16,
        marginTop: 8,
        gap: 12,
    },
    userName: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
    userRole: { fontSize: 12, color: '#6B7280', marginTop: 2 },
    // Sign-out row
    signOutRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 11,
        paddingHorizontal: 14,
        marginTop: 4,
        borderRadius: 10,
    },
    signOutRowHov: { backgroundColor: 'rgba(255,255,255,0.06)' },
    signOutTxt: { fontSize: 14, color: '#64748B', fontWeight: '500' },


    // ── Page header ───────────────────────────────────────────────────────────────
    pageHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    ctaBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2563EB', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 13, ...shadow('md') },
    ctaBtnHov: { backgroundColor: '#1D4ED8' },
    ctaBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

    // ── Metric cards ──────────────────────────────────────────────────────────────
    metricsRow: { flexDirection: 'row', gap: 20 },
    metricCard: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#E5E7EB', ...shadow('sm') },
    metricCardHov: { ...shadow('md') },
    metricTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    metricIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    metricSub: { flexDirection: 'row', alignItems: 'center', marginTop: 14 },

    // ── Section card ──────────────────────────────────────────────────────────────
    section: { backgroundColor: '#fff', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#E5E7EB', ...shadow('sm') },
    sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    viewAllBtn: { flexDirection: 'row', alignItems: 'center' },
    viewAllTxt: { fontSize: 14, fontWeight: '600', color: '#2563EB' },

    // ── DataRow (recent cases) ────────────────────────────────────────────────────
    dataRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 8, borderRadius: 10, gap: 14 },
    dataRowDiv: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    dataRowHov: { backgroundColor: '#F0F7FF' },
    dataRowMid: { flex: 1 },
    dataRowRight: { flexDirection: 'row', alignItems: 'center' },

    // ── Empty state ───────────────────────────────────────────────────────────────
    emptyBox: { alignItems: 'center', paddingVertical: 40, gap: 8 },
    emptyActionBtn: { backgroundColor: '#2563EB', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 12, marginTop: 8 },
    emptyActionTxt: { color: '#fff', fontSize: 14, fontWeight: '700' },

    // ── Badge — pill, no border, dot + label ──────────────────────────────────────────
    badgePill: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 6,
        alignSelf: 'flex-start',
    },

    // ── Table — FIX #3: white card container, rounded, shadow ─────────────────────
    // The table panel sits inside a padded page, wrapped with a rounded card shell
    tableWrap: { flex: 1, backgroundColor: '#fff', margin: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden', ...shadow('sm') },
    // FIX #3 header: stronger background, darker text, more letter-spacing
    tableHead: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#F1F5F9', borderBottomWidth: 1.5, borderBottomColor: '#DDE3EC' },
    // FIX #3 th: darker text, tighter letter-spacing, stronger contrast
    th: { fontSize: 11.5, fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: 0.7 },
    // FIX #3 rows: 16px vertical padding, clear dividers
    tableRow: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', alignItems: 'center' },
    // FIX #3 hover: vivid blue tint on row hover
    tableRowHov: { backgroundColor: '#EFF6FF' },
    // FIX #4: body text 14px, patient name will be bolded inline
    td: { fontSize: 14, color: '#111827', fontWeight: '400', paddingRight: 8 },

    // ── Toolbar — FIX #2: taller search bar, pill border-radius, clear border ──────
    toolbar: { flexDirection: 'row', gap: 12, alignItems: 'center' },
    // FIX #2: height 48, full border-radius pill, subtle border
    toolSearch: { flex: 1, flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#D1D5DB', borderRadius: 999, paddingHorizontal: 18, height: 48, backgroundColor: '#FFFFFF' },
    // FIX #2: filter button matching height, vertically centred
    filterBtn: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#D1D5DB', borderRadius: 12, paddingHorizontal: 16, height: 48, backgroundColor: '#fff', gap: 6 },
    filterBtnHov: { borderColor: '#2563EB', backgroundColor: '#F0F7FF' },
    dropDown: { position: 'absolute', right: 0, top: 48, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', zIndex: 200, minWidth: 190, ...shadow('lg') },
    ddItem: { padding: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    ddItemActive: { backgroundColor: '#EFF6FF' },
    ddEmpty: { padding: 14, color: '#9CA3AF', textAlign: 'center', fontSize: 14 },

    // ── Form ──────────────────────────────────────────────────────────────────────
    formCard: { backgroundColor: '#fff', borderRadius: 18, padding: 24, borderWidth: 1, borderColor: '#E5E7EB', ...shadow('sm') },
    fRow: { flexDirection: 'row', gap: 20 },
    field: { marginBottom: 20 },
    fieldLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
    input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, padding: 14, fontSize: 15, color: '#111827', backgroundColor: '#fff' },
    selRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    selDD: { position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', zIndex: 200, ...shadow('lg') },
    textarea: { height: 110, textAlignVertical: 'top', paddingTop: 14 },
    uploadBox: { borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#D1D5DB', borderRadius: 14, paddingVertical: 40, alignItems: 'center', backgroundColor: '#F8FAFC', gap: 8 },
    // ── Form buttons — rebuilt from scratch ─────────────────────────────────────
    // Button row: right-aligned, horizontal, consistent gap
    actions: { flexDirection: 'row', gap: 12, marginTop: 16, alignItems: 'center', justifyContent: 'flex-end' },

    // PRIMARY — 48px, radius-12, solid #2563EB shadow
    submitBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 48,
        paddingHorizontal: 22,
        backgroundColor: '#2563EB',
        borderRadius: 12,
        ...shadow('md'),
        minWidth: 160,
    },
    submitBtnHov: { backgroundColor: '#1D4ED8', ...shadow('lg') },  // slight lift on hover
    submitTxt: { color: '#FFFFFF', fontSize: 15, fontWeight: '600', letterSpacing: 0.1 },

    // SECONDARY — 48px, radius-12, transparent + light border
    cancelBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 48,
        paddingHorizontal: 22,
        backgroundColor: 'transparent',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#D1D5DB',
    },
    cancelBtnHov: { backgroundColor: '#F3F4F6', borderColor: '#9CA3AF' },
    cancelTxt: { fontSize: 15, color: '#374151', fontWeight: '500' },

    // ── Diagnosis Panel ──────────────────────────────────────────────────────────
    diagPanel: {
        width: 380,
        backgroundColor: '#fff',
        borderLeftWidth: 1,
        borderLeftColor: '#E5E7EB',
        ...shadow('lg'),
        zIndex: 10,
    },
    diagHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F8FAFC',
    },
    diagEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
    diagLabel: { fontSize: 12, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
    diagVal: { fontSize: 15, color: '#111827', lineHeight: 22, fontWeight: '500' },
    diagSub: { fontSize: 12, color: '#6B7280', marginTop: 4 },
    prescRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
    diagFooter: { borderTopWidth: 1, borderTopColor: '#F3F4F6', marginTop: 'auto', paddingVertical: 20 },
    doctorCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F8FAFC', padding: 12, borderRadius: 12 },
});

/**
 * app/dashboard/panchayat.jsx
 * Panchayat Health Officer Dashboard — Premium SaaS UI
 * Roles: Monitor village health trends, Track resource usage, Analytics.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView,
    ActivityIndicator, RefreshControl, Platform, Pressable
} from 'react-native';
import { Feather, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useAuth } from '../../context/AuthContext';
import { analyticsService, caseService } from '../../services/api';
import { StatCardSkeleton, SkeletonBox } from '../../components/ui/Skeleton';

import { CLR, TY, SP, SHADOW } from '../../constants/DesignTokens';


const WEB = Platform.OS === 'web';

const STS_MAP = {
    submitted: { label: 'Open', color: '#64748B' },
    assigned: { label: 'Assigned', color: '#3B82F6' },
    visited: { label: 'Visited', color: '#8B5CF6' },
    treated: { label: 'Treated', color: '#10B981' },
    closed: { label: 'Closed', color: '#94A3B8' },
};

// ─── PRIMITIVE COMPONENTS ─────────────────────────────────────────────────────

function Btn({ style, activeStyle, onPress, children }) {
    const [hov, setHov] = useState(false);
    return (
        <Pressable
            onPress={onPress}
            {...(WEB ? { onHoverIn: () => setHov(true), onHoverOut: () => setHov(false) } : {})}
            style={[style, hov && activeStyle]}
        >
            {children}
        </Pressable>
    );
}

function SidebarItem({ icon, label, active, onPress }) {
    return (
        <Btn style={[styles.navItem, active && styles.navItemActive]} onPress={onPress}>
            <Feather name={icon} size={18} color={active ? '#FFFFFF' : '#94A3B8'} />
            <Text style={[styles.navLabel, active && styles.navLabelActive]}>{label}</Text>
        </Btn>
    );
}

function StatCard({ label, value, icon, color, iBg, loading }) {
    if (loading) return <StatCardSkeleton />;
    return (
        <View style={styles.statCard}>
            <View>
                <Text style={styles.statLabel}>{label}</Text>
                <Text style={styles.statValue}>{value ?? '0'}</Text>
            </View>
            <View style={[styles.statIcon, { backgroundColor: iBg }]}>
                <Feather name={icon} size={22} color={color} />
            </View>
        </View>
    );
}

// ─── CHART COMPONENT ──────────────────────────────────────────────────────────

function DistributionChart({ data = [], total = 1 }) {
    return (
        <View style={styles.chartContainer}>
            {data.map((item, i) => {
                const count = item.count || 0;
                const pct = (count / (total || 1)) * 100;
                const meta = STS_MAP[item._id] || { label: item._id, color: CLR.primary };

                return (
                    <View key={i} style={styles.chartRow}>
                        <View style={styles.chartLabelArea}>
                            <Text style={styles.chartLabelText}>{meta.label}</Text>
                            <Text style={styles.chartCountText}>{count}</Text>
                        </View>
                        <View style={styles.progressBarBg}>
                            <View style={[styles.progressBarFill, { width: `${pct}%`, backgroundColor: meta.color }]} />
                        </View>
                    </View>
                );
            })}
        </View>
    );
}

// ─── MAIN VIEWS ──────────────────────────────────────────────────────────────

function AnalyticsView({ summary, loading, refreshing, onRefresh }) {
    const total = summary?.totalCases || 0;

    return (
        <ScrollView
            contentContainerStyle={styles.page}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[CLR.primary]} />}
        >
            <View>
                <Text style={styles.pageTitle}>Village Analytics</Text>
                <Text style={styles.pageSubtitle}>Real-time health reporting and staff allocation</Text>
            </View>

            <View style={styles.statsGrid}>
                <StatCard label="Total Cases" value={total} icon="file-text" color={CLR.primary} iBg="#EFF6FF" loading={loading} />
                <StatCard label="Active Patients" value={summary?.patientCount} icon="users" color={CLR.accent} iBg="#F5F3FF" loading={loading} />
                <StatCard label="Resolved" value={summary?.casesByStatus?.find(s => s._id === 'treated')?.count || 0} icon="check-circle" color="#10B981" iBg="#ECFDF5" loading={loading} />
            </View>

            <View style={styles.analyticsSection}>
                <View style={[styles.card, { flex: 1.5 }]}>
                    <Text style={styles.cardTitle}>Case Distribution</Text>
                    {loading ? <SkeletonBox height={200} /> : <DistributionChart data={summary?.casesByStatus} total={total} />}
                </View>

                <View style={[styles.card, { flex: 1 }]}>
                    <Text style={styles.cardTitle}>Regional Severity</Text>
                    {loading ? <SkeletonBox height={200} /> : (
                        <View style={{ gap: 16 }}>
                            {(summary?.casesBySeverity || []).map((s, i) => (
                                <View key={i} style={styles.severityItem}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: s._id === 'critical' ? '#EF4444' : s._id === 'high' ? '#F59E0B' : '#10B981' }} />
                                        <Text style={styles.severityLabel}>{s._id?.toUpperCase()}</Text>
                                    </View>
                                    <View style={styles.severityValueBadge}>
                                        <Text style={styles.severityValueText}>{s.count} cases</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            </View>
        </ScrollView>
    );
}

// ─── ROOT COMPONENT ───────────────────────────────────────────────────────────

export default function PanchayatDashboard() {
    const { user, logout } = useAuth();
    const [nav, setNav] = useState('analytics');
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = useCallback(async () => {
        try {
            const res = await analyticsService.summary();
            setSummary(res.data.data);
        } catch {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to fetch analytics.' });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    return (
        <View style={styles.root}>
            <View style={styles.sidebar}>
                <View style={styles.logoArea}>
                    <View style={[styles.logoIcon, { backgroundColor: 'transparent' }]}>
                        <FontAwesome5 name="heart" size={28} color="#000" style={{ position: 'absolute' }} />
                        <FontAwesome5 name="heartbeat" size={28} color="#6366F1" />
                    </View>
                    <View>
                        <Text style={styles.logoText}>Rural Health</Text>
                        <Text style={styles.logoSub}>PANCHAYAT</Text>
                    </View>
                </View>
                <Text style={styles.navHeading}>MANAGEMENT</Text>
                <SidebarItem icon="pie-chart" label="Health Analytics" active={nav === 'analytics'} onPress={() => setNav('analytics')} />
                <SidebarItem icon="map" label="Village Map" active={nav === 'villages'} onPress={() => setNav('villages')} />
                <SidebarItem icon="users" label="Staff Overview" active={nav === 'staff'} onPress={() => setNav('staff')} />
                <View style={{ flex: 1 }} />
                <Btn style={styles.logoutBtn} onPress={logout}>
                    <Feather name="log-out" size={16} color="#64748B" style={{ marginRight: 8 }} />
                    <Text style={{ color: '#64748B', fontWeight: '500' }}>Sign Out</Text>
                </Btn>
            </View>

            <View style={styles.main}>
                <View style={styles.topbar}>
                    <Feather name="menu" size={20} color={CLR.textSec} style={{ marginRight: 16 }} />
                    <Text style={{ fontSize: 16, fontWeight: '600', color: CLR.textPri }}>Health Officer</Text>
                    <View style={{ flex: 1 }} />
                    <View style={styles.userBadge}>
                        <Text style={styles.userName}>{user?.name?.split(' ')[0]}</Text>
                        <View style={styles.avatarMini}><Text style={styles.avatarTxt}>{user?.name?.[0]}</Text></View>
                    </View>
                </View>

                {nav === 'analytics' ? (
                    <AnalyticsView
                        summary={summary}
                        loading={loading}
                        refreshing={refreshing}
                        onRefresh={() => { setRefreshing(true); loadData(); }}
                    />
                ) : (
                    <View style={styles.center}><Text>Module coming soon</Text></View>
                )}
            </View>
        </View>
    );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    root: { flex: 1, flexDirection: 'row', backgroundColor: CLR.bg },
    sidebar: { width: 260, backgroundColor: CLR.sidebar, padding: 18 },
    main: { flex: 1 },
    page: { padding: 24, gap: 24 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    logoArea: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 32, paddingBottom: 18, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
    logoIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: CLR.accent, alignItems: 'center', justifyContent: 'center' },
    logoText: { fontSize: 18, fontWeight: '700', color: '#fff' },
    logoSub: { fontSize: 11, color: '#9CA3AF', letterSpacing: 1.5, textTransform: 'uppercase' },

    navHeading: { fontSize: 11, fontWeight: '600', color: '#64748B', letterSpacing: 1.5, marginBottom: 12 },
    navItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, gap: 12, marginBottom: 4 },
    navItemActive: { backgroundColor: CLR.primary },
    navLabel: { fontSize: 15, fontWeight: '500', color: '#CBD5E1' },
    navLabelActive: { color: '#fff', fontWeight: '600' },
    logoutBtn: { flexDirection: 'row', alignItems: 'center', padding: 12 },

    topbar: { height: 64, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24 },
    userBadge: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    userName: { color: CLR.textPri, fontWeight: '600' },
    avatarMini: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#DDD6FE', alignItems: 'center', justifyContent: 'center' },
    avatarTxt: { color: '#5B21B6', fontWeight: '700', fontSize: 13 },

    pageTitle: { fontSize: 26, fontWeight: '700', color: CLR.textPri },
    pageSubtitle: { fontSize: 14, color: CLR.textSec, marginTop: 4 },

    statsGrid: { flexDirection: 'row', gap: 16 },
    statCard: { flex: 1, backgroundColor: '#fff', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', ...SHADOW.sm },
    statLabel: { fontSize: 14, color: CLR.textSec, fontWeight: '500' },
    statValue: { fontSize: 24, fontWeight: '700', color: CLR.textPri, marginTop: 4 },
    statIcon: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

    analyticsSection: { flexDirection: 'row', gap: 20 },
    card: { backgroundColor: '#fff', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: '#E5E7EB', ...SHADOW.md },
    cardTitle: { fontSize: 16, fontWeight: '700', color: CLR.textPri, marginBottom: 20 },

    chartContainer: { gap: 18 },
    chartRow: { gap: 8 },
    chartLabelArea: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    chartLabelText: { fontSize: 13, color: CLR.textSec, fontWeight: '600' },
    chartCountText: { fontSize: 14, color: CLR.textPri, fontWeight: '700' },
    progressBarBg: { height: 10, backgroundColor: '#F1F5F9', borderRadius: 5, overflow: 'hidden' },
    progressBarFill: { height: '100%', borderRadius: 5 },

    severityItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    severityLabel: { fontSize: 12, fontWeight: '700', color: CLR.textSec, letterSpacing: 0.5 },
    severityValueBadge: { backgroundColor: '#F8FAFC', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#E2E8F0' },
    severityValueText: { fontSize: 12, fontWeight: '700', color: CLR.textPri }
});

/**
 * app/dashboard/admin.jsx
 * Admin Dashboard — Premium SaaS UI
 * Roles: User management, System analytics, Audit logs.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TextInput,
    ActivityIndicator, RefreshControl, Platform, Pressable
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useAuth } from '../../context/AuthContext';
import { analyticsService, userService, logService } from '../../services/api';
import { StatCardSkeleton, CaseRowSkeleton, SkeletonBox } from '../../components/ui/Skeleton';

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const CLR = {
    primary: '#2563EB',
    bg: '#F8FAFC',
    card: '#FFFFFF',
    textPri: '#111827',
    textSec: '#6B7280',
    border: '#E5E7EB',
    sidebar: '#0F172A',
    danger: '#EF4444',
};

const shadow = (lvl = 'sm') => {
    const isWeb = Platform.OS === 'web';
    if (lvl === 'md') return isWeb ? { boxShadow: '0 4px 12px rgba(0,0,0,0.08)' } : { elevation: 4, shadowOpacity: 0.1, shadowRadius: 10 };
    return isWeb ? { boxShadow: '0 1px 3px rgba(0,0,0,0.1)' } : { elevation: 2, shadowOpacity: 0.05, shadowRadius: 3 };
};

const WEB = Platform.OS === 'web';
const NO_OUTLINE = WEB ? { outlineStyle: 'none' } : {};

const ROLE_COLORS = {
    admin: { bg: '#FEE2E2', txt: '#991B1B' },
    senior_doctor: { bg: '#EDE9FE', txt: '#5B21B6' },
    junior_doctor: { bg: '#E0F2FE', txt: '#075985' },
    helpline: { bg: '#FEF3C7', txt: '#92400E' },
    panchayat: { bg: '#D1FAE5', txt: '#065F46' },
    patient: { bg: '#F3F4F6', txt: '#374151' },
};

// ─── PRIMITIVE COMPONENTS ─────────────────────────────────────────────────────

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

// ─── MAIN VIEWS ──────────────────────────────────────────────────────────────

function UsersView({ users, loading, onDeactivate }) {
    const [search, setSearch] = useState('');
    const filtered = users.filter(u =>
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <View style={{ flex: 1 }}>
            <View style={styles.toolbar}>
                <View style={styles.searchBar}>
                    <Feather name="search" size={16} color={CLR.textSec} style={{ marginRight: 8 }} />
                    <TextInput
                        style={[styles.searchInput, NO_OUTLINE]}
                        placeholder="Search users by name or email..."
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16 }}>
                {loading ? <CaseRowSkeleton count={6} /> : filtered.map(u => {
                    const rc = ROLE_COLORS[u.role] || ROLE_COLORS.patient;
                    return (
                        <View key={u._id} style={styles.userCard}>
                            <View style={styles.userAvatar}>
                                <Text style={styles.userAvatarTxt}>{u.name?.[0]?.toUpperCase()}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.userName}>{u.name}</Text>
                                <Text style={styles.userEmail}>{u.email}</Text>
                                <View style={[styles.roleLabel, { backgroundColor: rc.bg }]}>
                                    <Text style={[styles.roleLabelTxt, { color: rc.txt }]}>{u.role?.replace('_', ' ').toUpperCase()}</Text>
                                </View>
                            </View>
                            <View style={styles.userActionArea}>
                                <View style={[styles.statusDot, { backgroundColor: u.isActive ? '#10B981' : '#EF4444' }]} />
                                {u.isActive && (
                                    <Btn style={styles.deactivateBtn} onPress={() => onDeactivate(u._id, u.name)}>
                                        <Text style={styles.deactivateBtnTxt}>Suspend</Text>
                                    </Btn>
                                )}
                            </View>
                        </View>
                    );
                })}
            </ScrollView>
        </View>
    );
}

function LogsView({ logs, loading }) {
    return (
        <ScrollView contentContainerStyle={styles.page}>
            <View>
                <Text style={styles.pageTitle}>System Logs</Text>
                <Text style={styles.pageSubtitle}>Audit trail of all administrative actions</Text>
            </View>
            {loading ? <SkeletonBox height={400} /> : logs.map((log, i) => (
                <View key={i} style={styles.logItem}>
                    <View style={styles.logHeader}>
                        <Text style={[styles.logAction, { color: log.status === 'success' ? CLR.primary : CLR.danger }]}>{log.action}</Text>
                        <Text style={styles.logDate}>{new Date(log.createdAt).toLocaleString()}</Text>
                    </View>
                    <Text style={styles.logDetail}>Actor: <Text style={{ fontWeight: '600', color: CLR.textPri }}>{log.actorName}</Text> • {log.description}</Text>
                </View>
            ))}
        </ScrollView>
    );
}

// ─── ROOT COMPONENT ───────────────────────────────────────────────────────────

export default function AdminDashboard() {
    const { user, logout } = useAuth();
    const [nav, setNav] = useState('overview');
    const [summary, setSummary] = useState(null);
    const [users, setUsers] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = useCallback(async () => {
        try {
            const [aRes, uRes, lRes] = await Promise.all([
                analyticsService.summary(),
                userService.list({ limit: 100 }),
                logService.list({ limit: 50 })
            ]);
            setSummary(aRes.data.data);
            setUsers(uRes.data.data || []);
            setLogs(lRes.data.data || []);
        } catch {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to load system data.' });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const handleDeactivate = async (id, name) => {
        try {
            await userService.deactivate(id);
            Toast.show({ type: 'success', text1: 'User Suspended', text2: `${name} has been deactivated.` });
            loadData();
        } catch {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Action failed.' });
        }
    };

    return (
        <View style={styles.root}>
            <View style={styles.sidebar}>
                <View style={styles.logoArea}>
                    <View style={styles.logoIcon}><Ionicons name="settings" size={20} color="#fff" /></View>
                    <View>
                        <Text style={styles.logoText}>Rural Health</Text>
                        <Text style={styles.logoSub}>CONTROL PANEL</Text>
                    </View>
                </View>
                <Text style={styles.navHeading}>SYSTEM</Text>
                <SidebarItem icon="grid" label="Overview" active={nav === 'overview'} onPress={() => setNav('overview')} />
                <SidebarItem icon="users" label="User Management" active={nav === 'users'} onPress={() => setNav('users')} />
                <SidebarItem icon="list" label="Audit Logs" active={nav === 'logs'} onPress={() => setNav('logs')} />
                <View style={{ flex: 1 }} />
                <Btn style={styles.logoutBtn} onPress={logout}>
                    <Feather name="log-out" size={16} color="#64748B" style={{ marginRight: 8 }} />
                    <Text style={{ color: '#64748B', fontWeight: '500' }}>Sign Out</Text>
                </Btn>
            </View>

            <View style={styles.main}>
                <View style={styles.topbar}>
                    <Feather name="menu" size={20} color={CLR.textSec} style={{ marginRight: 16 }} />
                    <Text style={{ fontSize: 16, fontWeight: '600', color: CLR.textPri }}>Super Admin</Text>
                    <View style={{ flex: 1 }} />
                    <View style={styles.userBadge}>
                        <Text style={styles.userName}>{user?.name}</Text>
                        <View style={styles.avatarMini}><Text style={styles.avatarTxt}>A</Text></View>
                    </View>
                </View>

                {nav === 'overview' ? (
                    <ScrollView
                        contentContainerStyle={styles.page}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} colors={[CLR.primary]} />}
                    >
                        <View>
                            <Text style={styles.pageTitle}>System Overview</Text>
                            <Text style={styles.pageSubtitle}>Global health statistics and system health</Text>
                        </View>
                        <View style={styles.statsGrid}>
                            <StatCard label="Total Cases" value={summary?.totalCases} icon="activity" color={CLR.primary} iBg="#EFF6FF" loading={loading} />
                            <StatCard label="Active Users" value={users.length} icon="users" color="#10B981" iBg="#ECFDF5" loading={loading} />
                            <StatCard label="Patients" value={summary?.patientCount} icon="heart" color="#F43F5E" iBg="#FFF1F2" loading={loading} />
                        </View>

                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>Global Case Status</Text>
                            <View style={styles.statusGrid}>
                                {(summary?.casesByStatus || []).map((s, i) => (
                                    <View key={i} style={styles.statusTile}>
                                        <Text style={styles.statusTileVal}>{s.count}</Text>
                                        <Text style={styles.statusTileLbl}>{s._id.toUpperCase()}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </ScrollView>
                ) : nav === 'users' ? (
                    <UsersView users={users} loading={loading} onDeactivate={handleDeactivate} />
                ) : nav === 'logs' ? (
                    <LogsView logs={logs} loading={loading} />
                ) : null}
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

    logoArea: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 32, paddingBottom: 18, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
    logoIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#3B82F6', alignItems: 'center', justifyContent: 'center' },
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
    avatarMini: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#E0F2FE', alignItems: 'center', justifyContent: 'center' },
    avatarTxt: { color: '#0369A1', fontWeight: '700', fontSize: 13 },

    pageTitle: { fontSize: 26, fontWeight: '700', color: CLR.textPri },
    pageSubtitle: { fontSize: 14, color: CLR.textSec, marginTop: 4 },

    statsGrid: { flexDirection: 'row', gap: 16 },
    statCard: { flex: 1, backgroundColor: '#fff', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', ...shadow() },
    statLabel: { fontSize: 13, color: CLR.textSec, fontWeight: '500' },
    statValue: { fontSize: 24, fontWeight: '700', color: CLR.textPri, marginTop: 4 },
    statIcon: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

    card: { backgroundColor: '#fff', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: '#E5E7EB', ...shadow('md') },
    cardTitle: { fontSize: 16, fontWeight: '700', color: CLR.textPri, marginBottom: 20 },

    statusGrid: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
    statusTile: { flex: 1, minWidth: 100, padding: 16, borderRadius: 12, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#F1F5F9', alignItems: 'center' },
    statusTileVal: { fontSize: 20, fontWeight: '700', color: CLR.textPri },
    statusTileLbl: { fontSize: 10, fontWeight: '800', color: CLR.textSec, marginTop: 4, letterSpacing: 0.5 },

    toolbar: { paddingHorizontal: 24, paddingVertical: 16 },
    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 16, height: 44, borderWidth: 1, borderColor: '#E5E7EB' },
    searchInput: { flex: 1, padding: 0, fontSize: 15, color: CLR.textPri, height: '100%' },

    userCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E5E7EB', ...shadow() },
    userAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
    userAvatarTxt: { fontSize: 18, fontWeight: '700', color: CLR.primary },
    userName: { fontSize: 15, fontWeight: '700', color: CLR.textPri },
    userEmail: { fontSize: 13, color: CLR.textSec, marginBottom: 6 },
    roleLabel: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    roleLabelTxt: { fontSize: 10, fontWeight: '800' },
    userActionArea: { alignItems: 'flex-end', gap: 10 },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    deactivateBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, backgroundColor: '#FEF2F2' },
    deactivateBtnTxt: { fontSize: 11, fontWeight: '700', color: CLR.danger },

    logItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    logHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    logAction: { fontSize: 14, fontWeight: '700' },
    logDate: { fontSize: 12, color: CLR.textSec },
    logDetail: { fontSize: 13, color: CLR.textSec }
});

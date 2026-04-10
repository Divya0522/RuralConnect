/**
 * app/dashboard/helpline.jsx
 * Helpline Operator Dashboard — Premium SaaS UI
 * Roles: Register complaints, Assign doctors, Track pending cases.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TextInput,
    ActivityIndicator, RefreshControl, Platform, Pressable
} from 'react-native';
import { Feather, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useAuth } from '../../context/AuthContext';
import { caseService, patientService, userService, villageService } from '../../services/api';
import { StatCardSkeleton, CaseRowSkeleton, SkeletonBox } from '../../components/ui/Skeleton';

import { CLR, TY, SP, SHADOW } from '../../constants/DesignTokens';


const WEB = Platform.OS === 'web';
const NO_OUTLINE = WEB ? { outlineStyle: 'none' } : {};

const PRI_MAP = {
    critical: { label: 'Critical', txt: '#B91C1C', bg: '#FEF2F2', dot: '#EF4444' },
    high: { label: 'High', txt: '#C2410C', bg: '#FFF7ED', dot: '#F97316' },
    medium: { label: 'Medium', txt: '#B45309', bg: '#FEFCE8', dot: '#F59E0B' },
    low: { label: 'Low', txt: '#15803D', bg: '#F0FDF4', dot: '#22C55E' },
};

const STS_MAP = {
    'NEW': { label: 'New Complaint', txt: '#6B7280', bg: '#F9FAFB', dot: '#9CA3AF' },
    'ASSIGNED': { label: 'Doctor Assigned', txt: '#4338CA', bg: '#EEF2FF', dot: '#6366F1' },
    'DIAGNOSED': { label: 'Diagnosed', txt: '#7C3AED', bg: '#F5F3FF', dot: '#8B5CF6' },
    'FOLLOWUP': { label: 'Follow-up', txt: '#F59E0B', bg: '#FFFBEB', dot: '#D97706' },
    'ESCALATED': { label: 'Escalated', txt: '#EF4444', bg: '#FEF2F2', dot: '#DC2626' },
    'SPECIALIST_REVIEW': { label: 'Specialist Review', txt: '#1D4ED8', bg: '#EFF6FF', dot: '#2563EB' },
    'RESOLVED': { label: 'Resolved', txt: '#15803D', bg: '#F0FDF4', dot: '#22C55E' },
    'CLOSED': { label: 'Closed', txt: '#6B7280', bg: '#F1F5F9', dot: '#94A3B8' },
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

function StatusBadge({ label, txt, bg, dot }) {
    return (
        <View style={[styles.badgePill, { backgroundColor: bg }]}>
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: dot, marginRight: 5 }} />
            <Text style={{ fontSize: 13, fontWeight: '600', color: txt }}>{label}</Text>
        </View>
    );
}

function PageHeader({ title, subtitle, action, onAction }) {
    return (
        <View style={styles.pageHeader}>
            <View>
                <Text style={styles.pageTitle}>{title}</Text>
                {subtitle ? <Text style={styles.pageSubtitle}>{subtitle}</Text> : null}
            </View>
            {action && (
                <Btn style={styles.ctaBtn} activeStyle={{ backgroundColor: CLR.primaryDk }} onPress={onAction}>
                    <Feather name="plus" size={16} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.ctaBtnText}>{action}</Text>
                </Btn>
            )}
        </View>
    );
}

function SidebarItem({ icon, label, active, onPress }) {
    const activeGradient = WEB && active
        ? { backgroundImage: 'linear-gradient(90deg, #2563EB 0%, #3B82F6 100%)', boxShadow: '0 4px 12px rgba(37,99,235,0.30)' }
        : {};
    return (
        <Btn style={[styles.navItem, active && styles.navItemActive, activeGradient]} onPress={onPress}>
            <Feather name={icon} size={18} color={active ? '#FFFFFF' : '#94A3B8'} />
            <Text style={[styles.navLabel, active && styles.navLabelActive]}>{label}</Text>
        </Btn>
    );
}

function DashboardCard({ label, value, icon, color, iBg, loading }) {
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

function CasesView({ cases, loading, refreshing, onRefresh, juniorDoctors, seniorDoctors, onAssign }) {
    const [search, setSearch] = useState('');
    const [assigningId, setAssigningId] = useState(null);
    const [assignRole, setAssignRole] = useState(null); // 'junior_doctor' or 'senior_doctor'
    const [assignOpen, setAssignOpen] = useState(false);

    const filtered = cases.filter(c =>
        c.chiefComplaint?.toLowerCase().includes(search.toLowerCase()) ||
        c.patient?.name?.toLowerCase().includes(search.toLowerCase())
    );

    const handleAssignClick = (caseId) => {
        setAssigningId(caseId);
        setAssignRole(null);
        setAssignOpen(false);
    };

    return (
        <View style={{ flex: 1 }}>
            <View style={styles.toolbar}>
                <View style={styles.searchBar}>
                    <Feather name="search" size={16} color={CLR.textSec} style={{ marginRight: 8 }} />
                    <TextInput
                        style={[styles.searchInput, NO_OUTLINE]}
                        placeholder="Search cases, patients..."
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>
            </View>

            <ScrollView
                contentContainerStyle={{ padding: 16 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[CLR.primary]} />}
            >
                {loading ? (
                    <CaseRowSkeleton count={5} />
                ) : filtered.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Feather name="inbox" size={48} color={CLR.border} />
                        <Text style={styles.emptyText}>No pending cases found</Text>
                    </View>
                ) : (
                    filtered.map(c => (
                        <View key={c._id} style={styles.caseRow}>
                            <View style={styles.caseBody}>
                                <View style={styles.caseHeader}>
                                    <Text style={styles.patientName}>{c.patient?.name || 'Unknown'}</Text>
                                    <StatusBadge {...PRI_MAP[c.severity || 'low']} />
                                </View>
                                <Text style={styles.complaintText} numberOfLines={2}>{c.chiefComplaint}</Text>
                                <Text style={styles.caseMeta}>Village: {c.village?.name || 'N/A'} • {new Date(c.createdAt).toLocaleDateString()}</Text>

                                {assigningId === c._id ? (
                                    <View style={styles.assignPanel}>
                                        <Text style={styles.assignPanelTitle}>Select Doctor Type</Text>

                                        <View style={styles.roleToggleRow}>
                                            <Btn
                                                style={[styles.roleBtn, assignRole === 'junior' && styles.roleBtnActive]}
                                                onPress={() => { setAssignRole('junior'); setAssignOpen(false); }}
                                            >
                                                <Feather name="activity" size={16} color={assignRole === 'junior' ? '#fff' : CLR.textSec} style={{ marginRight: 6 }} />
                                                <Text style={[styles.roleBtnTxt, assignRole === 'junior' && { color: '#fff' }]}>Junior Doctor ({juniorDoctors.length})</Text>
                                            </Btn>
                                            <Btn
                                                style={[styles.roleBtn, assignRole === 'senior' && styles.roleBtnActiveAlt]}
                                                onPress={() => { setAssignRole('senior'); setAssignOpen(false); }}
                                            >
                                                <Feather name="award" size={16} color={assignRole === 'senior' ? '#fff' : CLR.textSec} style={{ marginRight: 6 }} />
                                                <Text style={[styles.roleBtnTxt, assignRole === 'senior' && { color: '#fff' }]}>Senior Doctor ({seniorDoctors.length})</Text>
                                            </Btn>
                                        </View>

                                        {assignRole && (
                                            <View style={[styles.doctorSelectWrap, { zIndex: 100 }]}>
                                                <Btn style={[styles.input, styles.selRow, assignOpen && { borderColor: CLR.primary }]} onPress={() => setAssignOpen(!assignOpen)}>
                                                    <Text style={{ fontSize: 14, color: CLR.textPri }}>Select a {assignRole} doctor...</Text>
                                                    <Feather name={assignOpen ? 'chevron-up' : 'chevron-down'} size={15} color={CLR.textSec} />
                                                </Btn>

                                                {assignOpen && (
                                                    <View style={styles.selDDInline}>
                                                        <ScrollView style={{ maxHeight: 240 }} nestedScrollEnabled>
                                                            {(assignRole === 'junior' ? juniorDoctors : seniorDoctors).map(d => (
                                                                <Btn key={d._id} style={styles.doctorListItem} onPress={() => onAssign(c._id, d._id, d.name)} activeStyle={{ backgroundColor: '#F8FAFC' }}>
                                                                    <AvatarCircle name={d.name} size={32} idx={d._id.charCodeAt(d._id.length - 1)} />
                                                                    <View style={{ marginLeft: 12, flex: 1 }}>
                                                                        <Text style={styles.doctorListName}>Dr. {d.name}</Text>
                                                                        <Text style={styles.doctorListEmail}>{d.email}</Text>
                                                                    </View>
                                                                    <Feather name="chevron-right" size={16} color={CLR.primary} />
                                                                </Btn>
                                                            ))}
                                                        </ScrollView>
                                                    </View>
                                                )}
                                            </View>
                                        )}

                                        <Btn style={styles.cancelBtnInline} onPress={() => setAssigningId(null)}>
                                            <Text style={styles.cancelBtnTextLine}>Cancel Assignment</Text>
                                        </Btn>
                                    </View>
                                ) : (
                                    <Btn style={styles.assignBtn} onPress={() => handleAssignClick(c._id)}>
                                        <Feather name="user-plus" size={14} color={CLR.primary} style={{ marginRight: 6 }} />
                                        <Text style={styles.assignBtnText}>Assign Doctor</Text>
                                    </Btn>
                                )}
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>
        </View>
    );
}

function RegisterCaseView({ user, onSuccess }) {
    const [villages, setVillages] = useState([]);
    const [loadingV, setLoadingV] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [openDD, setOpenDD] = useState(null);
    const [form, setForm] = useState({
        name: '', phone: '', age: '', gender: 'male',
        village: '', villageName: '', complaint: '', severity: 'medium',
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
        if (!form.complaint.trim() || !form.name.trim()) {
            Toast.show({ type: 'error', text1: 'Required', text2: 'Name and complaint are required.' });
            return;
        }
        setSubmitting(true);
        try {
            const pRes = await patientService.create({
                name: form.name, phone: form.phone,
                age: parseInt(form.age) || undefined,
                gender: form.gender, village: form.village || undefined
            });
            const pid = pRes.data.data._id;
            const fd = new FormData();
            fd.append('patient', pid);
            fd.append('chiefComplaint', form.complaint);
            if (form.village) fd.append('village', form.village);
            if (form.severity) fd.append('severity', form.severity);
            await caseService.create(fd);
            Toast.show({ type: 'success', text1: 'Case Registered', text2: 'New complaint has been filed.' });
            onSuccess();
        } catch (e) {
            Toast.show({ type: 'error', text1: 'Error', text2: e.response?.data?.error || 'Registration failed' });
        } finally { setSubmitting(false); }
    };

    const SelField = ({ label, ddKey, display, value, placeholder, children }) => (
        <View style={[styles.field, { zIndex: openDD === ddKey ? 100 : 1 }]}>
            <Text style={styles.fieldLabel}>{label}</Text>
            <Btn style={[styles.input, styles.selRow, openDD === ddKey && { borderColor: CLR.primary }]} onPress={() => tog(ddKey)}>
                <Text style={{ fontSize: 15, color: value ? CLR.textPri : CLR.textSec }}>{display || placeholder}</Text>
                <Feather name={openDD === ddKey ? 'chevron-up' : 'chevron-down'} size={15} color={CLR.textSec} />
            </Btn>
            {openDD === ddKey && <View style={styles.selDD}><ScrollView style={{ maxHeight: 180 }}>{children}</ScrollView></View>}
        </View>
    );

    return (
        <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
            <PageHeader title="Register New Case" subtitle="File a complaint on behalf of a patient" />
            <View style={styles.formCard}>
                <View style={styles.fRow}>
                    <View style={[styles.field, { flex: 1 }]}>
                        <Text style={styles.fieldLabel}>Patient Name</Text>
                        <TextInput style={[styles.input, NO_OUTLINE]} value={form.name} onChangeText={set('name')} placeholder="Full Name" />
                    </View>
                    <View style={[styles.field, { flex: 1 }]}>
                        <Text style={styles.fieldLabel}>Phone Number</Text>
                        <TextInput style={[styles.input, NO_OUTLINE]} value={form.phone} onChangeText={set('phone')} placeholder="+91 XXXXX XXXXX" keyboardType="phone-pad" />
                    </View>
                </View>

                <View style={styles.fRow}>
                    <View style={{ flex: 1 }}>
                        <SelField label="Village" ddKey="village" display={form.villageName} value={form.village} placeholder="Select Village">
                            {loadingV ? <View style={{ padding: 20 }}><ActivityIndicator size="small" color={CLR.primary} /></View> :
                                villages.map(v => (
                                    <Btn key={v._id} style={styles.ddItem} onPress={() => { setForm(f => ({ ...f, village: v._id, villageName: v.name })); setOpenDD(null); }}>
                                        <Text style={{ color: CLR.textPri }}>{v.name}</Text>
                                    </Btn>
                                ))
                            }
                        </SelField>
                    </View>
                    <View style={[styles.field, { flex: 1 }]}>
                        <Text style={styles.fieldLabel}>Age</Text>
                        <TextInput style={[styles.input, NO_OUTLINE]} value={form.age} onChangeText={set('age')} placeholder="Age" keyboardType="numeric" />
                    </View>
                </View>

                <View style={styles.field}>
                    <Text style={styles.fieldLabel}>Chief Complaint</Text>
                    <TextInput style={[styles.input, styles.textarea, NO_OUTLINE]} value={form.complaint} onChangeText={set('complaint')} placeholder="Describe the health issue..." multiline />
                </View>

                <View style={[styles.fRow, { zIndex: 10 }]}>
                    <View style={{ flex: 1 }}>
                        <SelField label="Gender" ddKey="gender" display={form.gender} value={form.gender}>
                            {['male', 'female', 'other'].map(g => (
                                <Btn key={g} style={styles.ddItem} onPress={() => { set('gender')(g); setOpenDD(null); }}>
                                    <Text style={{ color: CLR.textPri }}>{g.charAt(0).toUpperCase() + g.slice(1)}</Text>
                                </Btn>
                            ))}
                        </SelField>
                    </View>
                    <View style={{ flex: 1 }}>
                        <SelField label="Initial Severity" ddKey="severity" display={form.severity} value={form.severity}>
                            {['low', 'medium', 'high', 'critical'].map(s => (
                                <Btn key={s} style={styles.ddItem} onPress={() => { set('severity')(s); setOpenDD(null); }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: PRI_MAP[s].dot }} />
                                        <Text style={{ color: CLR.textPri }}>{s.charAt(0).toUpperCase() + s.slice(1)}</Text>
                                    </View>
                                </Btn>
                            ))}
                        </SelField>
                    </View>
                </View>

                <View style={styles.actions}>
                    <Btn style={styles.submitBtn} onPress={submit} disabled={submitting}>
                        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitTxt}>Register & Save Case</Text>}
                    </Btn>
                </View>
            </View>
        </ScrollView>
    );
}

// ─── ROOT COMPONENT ───────────────────────────────────────────────────────────

export default function HelplineDashboard() {
    const { user, logout } = useAuth();
    const [nav, setNav] = useState('cases');
    const [cases, setCases] = useState([]);
    const [juniorDoctors, setJuniorDoctors] = useState([]);
    const [seniorDoctors, setSeniorDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = useCallback(async () => {
        try {
            const [cRes, jRes, sRes] = await Promise.all([
                caseService.list({ status: 'NEW', limit: 50 }),
                userService.list({ role: 'junior_doctor', isActive: true, limit: 100 }),
                userService.list({ role: 'senior_doctor', isActive: true, limit: 100 })
            ]);
            setCases(cRes.data.data || []);
            setJuniorDoctors(jRes.data.data || []);
            setSeniorDoctors(sRes.data.data || []);
        } catch {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to fetch dashboard data.' });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const handleAssign = async (cid, did, dname) => {
        try {
            await caseService.assign(cid, { assignedTo: did, note: `Assigned by ${user.name}` });
            Toast.show({ type: 'success', text1: 'Success', text2: `Case assigned to Dr. ${dname}` });
            loadData();
        } catch (e) {
            Toast.show({ type: 'error', text1: 'Error', text2: e.response?.data?.error || 'Assignment failed' });
        }
    };

    return (
        <View style={styles.root}>
            {/* Sidebar */}
            <View style={styles.sidebar}>
                <View style={styles.logoArea}>
                    <View style={[styles.logoIcon, { backgroundColor: 'transparent' }]}>
                        <FontAwesome5 name="heart" size={28} color="#000" style={{ position: 'absolute' }} />
                        <FontAwesome5 name="heartbeat" size={28} color="#6366F1" />
                    </View>
                    <View>
                        <Text style={styles.logoText}>Rural Health</Text>
                        <Text style={styles.logoSub}>CONNECT</Text>
                    </View>
                </View>
                <Text style={styles.navHeading}>NAVIGATION</Text>
                <SidebarItem icon="home" label="Dashboard" active={nav === 'dashboard'} onPress={() => setNav('dashboard')} />
                <SidebarItem icon="list" label="Pending Cases" active={nav === 'cases'} onPress={() => setNav('cases')} />
                <SidebarItem icon="plus-square" label="Register Case" active={nav === 'register'} onPress={() => setNav('register')} />
                <View style={{ flex: 1 }} />
                <Btn style={styles.logoutBtn} onPress={logout}>
                    <Feather name="log-out" size={16} color="#64748B" style={{ marginRight: 8 }} />
                    <Text style={{ color: '#64748B', fontWeight: '500' }}>Sign Out</Text>
                </Btn>
            </View>

            {/* Main Content */}
            <View style={styles.main}>
                <View style={styles.topbar}>
                    <Feather name="menu" size={20} color={CLR.textSec} style={{ marginRight: 16 }} />
                    <Text style={{ fontSize: 16, fontWeight: '600', color: CLR.textPri }}>Helpline Operator</Text>
                    <View style={{ flex: 1 }} />
                    <View style={styles.userBadge}>
                        <Text style={styles.userName}>{user?.name?.split(' ')[0]}</Text>
                        <AvatarCircle name={user?.name} size={30} idx={0} style={{ marginLeft: 8 }} />
                    </View>
                </View>

                {nav === 'dashboard' ? (
                    <ScrollView contentContainerStyle={styles.page}>
                        <PageHeader title="Helpline Overview" subtitle="Monitor and direct healthcare assistance" action="Register Case" onAction={() => setNav('register')} />
                        <View style={styles.statsGrid}>
                            <DashboardCard label="Pending Cases" value={cases.length} icon="inbox" color={CLR.warning} iBg="#FFFBEB" loading={loading} />
                            <DashboardCard label="Junior Doctors" value={juniorDoctors.length} icon="activity" color={CLR.primary} iBg="#EFF6FF" loading={loading} />
                            <DashboardCard label="Senior Doctors" value={seniorDoctors.length} icon="award" color={CLR.success} iBg="#F0FDF4" loading={loading} />
                        </View>
                    </ScrollView>
                ) : nav === 'cases' ? (
                    <View style={{ flex: 1 }}>
                        <View style={{ padding: 24, paddingBottom: 0 }}>
                            <PageHeader title="Pending Cases" subtitle="Assign healthcare workers to new complaints" />
                        </View>
                        <CasesView
                            cases={cases}
                            loading={loading}
                            refreshing={refreshing}
                            onRefresh={() => { setRefreshing(true); loadData(); }}
                            juniorDoctors={juniorDoctors}
                            seniorDoctors={seniorDoctors}
                            onAssign={handleAssign}
                        />
                    </View>
                ) : nav === 'register' ? (
                    <RegisterCaseView user={user} onSuccess={() => { setNav('cases'); loadData(); }} />
                ) : (
                    <View style={styles.center}><Text>Module coming soon</Text></View>
                )}
            </View>
        </View>
    );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

function AvatarCircle({ name = '?', size = 40, idx = 0, style }) {
    const colors = [{ bg: '#DBEAFE', txt: '#1E40AF' }, { bg: '#DCFCE7', txt: '#166534' }];
    const c = colors[idx % colors.length];
    return (
        <View style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center' }, style]}>
            <Text style={{ fontSize: size * 0.4, fontWeight: '700', color: c.txt }}>{name.charAt(0).toUpperCase()}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, flexDirection: 'row', backgroundColor: CLR.bg },
    sidebar: { width: 260, backgroundColor: '#0F172A', padding: 18 },
    main: { flex: 1 },
    page: { padding: 24, gap: 24 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    logoArea: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 32, paddingBottom: 18, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
    logoIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#3B82F6', alignItems: 'center', justifyContent: 'center' },
    logoText: { fontSize: 18, fontWeight: '700', color: '#fff' },
    logoSub: { fontSize: 11, color: '#9CA3AF', letterSpacing: 1.5, textTransform: 'uppercase' },

    navHeading: { fontSize: 11, fontWeight: '600', color: '#64748B', letterSpacing: 1.5, marginBottom: 12 },
    navItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, gap: 12, marginBottom: 4 },
    navItemActive: { backgroundColor: '#2563EB' },
    navLabel: { fontSize: 15, fontWeight: '500', color: '#CBD5E1' },
    navLabelActive: { color: '#fff', fontWeight: '600' },
    logoutBtn: { flexDirection: 'row', alignItems: 'center', padding: 12 },

    topbar: { height: 64, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24 },
    userBadge: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    userName: { color: CLR.textPri, fontWeight: '600' },

    pageTitle: { fontSize: 26, fontWeight: '700', color: CLR.textPri },
    pageSubtitle: { fontSize: 15, color: CLR.textSec, marginTop: 4 },
    ctaBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: CLR.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
    ctaBtnText: { color: '#fff', fontWeight: '600' },

    statsGrid: { flexDirection: 'row', gap: 16 },
    statCard: { flex: 1, backgroundColor: '#fff', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', ...SHADOW.sm },
    statLabel: { fontSize: 14, color: CLR.textSec, fontWeight: '500' },
    statValue: { fontSize: 24, fontWeight: '700', color: CLR.textPri, marginTop: 4 },
    statIcon: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

    toolbar: { paddingHorizontal: 24, paddingTop: 16 },
    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 16, height: 44, borderWidth: 1, borderColor: '#E5E7EB' },
    searchInput: { flex: 1, padding: 0, fontSize: 15, color: CLR.textPri, height: '100%' },

    caseRow: { backgroundColor: '#fff', borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E5E7EB', ...SHADOW.sm },
    caseBody: { padding: 16 },
    caseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    patientName: { fontSize: 16, fontWeight: '600', color: CLR.textPri },
    complaintText: { fontSize: 15, color: CLR.textSec, marginBottom: 12 },
    caseMeta: { fontSize: 13, color: '#94A3B8', marginBottom: 16 },

    badgePill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },

    assignBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE' },
    assignBtnText: { color: CLR.primary, fontWeight: '600', fontSize: 14 },

    assignPanel: { backgroundColor: '#F8FAFC', padding: 16, borderRadius: 12, marginTop: 8, borderWidth: 1, borderColor: '#F1F5F9' },
    assignPanelTitle: { fontSize: 14, fontWeight: '600', color: CLR.textPri, marginBottom: 12 },

    roleToggleRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    roleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB' },
    roleBtnActive: { backgroundColor: CLR.primary, borderColor: CLR.primary },
    roleBtnActiveAlt: { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
    roleBtnTxt: { fontSize: 13, fontWeight: '600', color: CLR.textSec },

    doctorSelectWrap: { position: 'relative', zIndex: 10 },
    selDDInline: { position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', zIndex: 50, marginTop: 4, ...SHADOW.md, overflow: 'hidden' },
    doctorListItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    doctorListName: { fontSize: 14, fontWeight: '600', color: CLR.textPri },
    doctorListEmail: { fontSize: 12, color: CLR.textSec, marginTop: 2 },
    cancelBtnInline: { marginTop: 16, padding: 8, alignSelf: 'center' },
    cancelBtnTextLine: { color: CLR.textSec, fontWeight: '500', fontSize: 13 },

    formCard: { backgroundColor: '#fff', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: '#E5E7EB', ...SHADOW.md },
    fRow: { flexDirection: 'row', gap: 18, marginBottom: 18 },
    field: { gap: 8, marginBottom: 18 },
    fieldLabel: { fontSize: 14, fontWeight: '600', color: '#374151' },
    input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, paddingHorizontal: 14, height: 48, fontSize: 15, color: CLR.textPri },
    selRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    selDD: { position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', zIndex: 100, ...SHADOW.md },
    ddItem: { padding: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    textarea: { height: 100, textAlignVertical: 'top', paddingTop: 12 },
    actions: { marginTop: 12, alignItems: 'flex-end' },
    submitBtn: { backgroundColor: CLR.primary, height: 48, paddingHorizontal: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', ...SHADOW.md },
    submitTxt: { color: '#fff', fontSize: 15, fontWeight: '600' },

    emptyState: { alignItems: 'center', padding: 48 },
    emptyText: { marginTop: 16, color: CLR.textSec, fontSize: 15 }
});

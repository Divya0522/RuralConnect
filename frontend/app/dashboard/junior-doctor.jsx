/**
 * app/dashboard/junior-doctor.jsx
 * Junior Doctor Dashboard — High Fidelity Redesign
 * Matches Image 1 UI while maintaining Junior Doctor specific workflows.
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TextInput,
    ActivityIndicator, RefreshControl, Platform, Pressable, Linking
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useAuth } from '../../context/AuthContext';
import { caseService, diagnosisService, analyticsService, userService, followUpService } from '../../services/api';
import { StatCardSkeleton, CaseRowSkeleton, SkeletonBox } from '../../components/ui/Skeleton';
import NotificationBell from '../../components/patient/NotificationBell';
import { CLR, TY, SP, SHADOW } from '../../constants/DesignTokens';

const WEB = Platform.OS === 'web';
const NO_OUTLINE = WEB ? { outlineStyle: 'none' } : {};

const PRI_MAP = {
    critical: { label: 'Critical', txt: '#991B1B', bg: '#FEF2F2', dot: '#EF4444' },
    high: { label: 'High', txt: '#B91C1C', bg: '#FEE2E2', dot: '#EF4444' },
    medium: { label: 'Medium', txt: CLR.status.FOLLOWUP.txt, bg: CLR.status.FOLLOWUP.bg, dot: CLR.status.FOLLOWUP.dot },
    low: { label: 'Low', txt: CLR.status.ASSIGNED.txt, bg: CLR.status.ASSIGNED.bg, dot: CLR.status.ASSIGNED.dot },
};

const STS_MAP = {
    'NEW': { label: 'New Complaint', ...CLR.status.NEW },
    'ASSIGNED': { label: 'Doctor Assigned', ...CLR.status.ASSIGNED },
    'DIAGNOSED': { label: 'Diagnosed', ...CLR.status.DIAGNOSED },
    'FOLLOWUP': { label: 'Follow-up', ...CLR.status.FOLLOWUP },
    'ESCALATED': { label: 'Escalated', ...CLR.status.ESCALATED },
    'SPECIALIST_REVIEW': { label: 'Specialist Review', ...CLR.status.SPECIALIST_REVIEW },
    'RESOLVED': { label: 'Resolved', ...CLR.status.RESOLVED },
    'CLOSED': { label: 'Closed', ...CLR.status.CLOSED },
};

// ─── UTILITY COMPONENTS ───────────────────────────────────────────────────────

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
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: dot, marginRight: 6 }} />
            <Text style={[styles.badgeTxt, { color: txt }]}>{label}</Text>
        </View>
    );
}

function StatCard({ label, value, icon, color, bg, loading, trend }) {
    if (loading) return <StatCardSkeleton />;
    return (
        <View style={styles.statCard}>
            <View style={{ flex: 1 }}>
                <Text style={styles.statLabel}>{label}</Text>
                <Text style={styles.statValue}>{value ?? '0'}</Text>
                {trend && (
                    <Text style={styles.statTrend}>
                        <Feather name="trending-up" size={12} color={CLR.success} /> {trend}
                    </Text>
                )}
            </View>
            <View style={[styles.statIconCircle, { backgroundColor: bg }]}>
                {icon}
            </View>
        </View>
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

function AvatarCircle({ name = '?', size = 32, idx = 0, style }) {
    const colors = [{ bg: '#F8FAFC', txt: '#475569' }];
    const c = colors[0];
    return (
        <View style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: CLR.border }, style]}>
            <Text style={{ fontSize: size * 0.4, fontWeight: '700', color: c.txt }}>{name.charAt(0).toUpperCase()}</Text>
        </View>
    );
}

function TopHeader({ user, onSelectCase }) {
    return (
        <View style={styles.topHeader}>
            <View style={styles.headerLeft}>
                <Feather name="shield" size={18} color={CLR.primary} />
                <Text style={[TY.bodySemi, { marginLeft: 10 }]}>Secure Clinical Environment</Text>
            </View>
            <View style={styles.headerRight}>
                <NotificationBell onSelectCase={onSelectCase} />
            </View>
        </View>
    );
}

// ─── MAIN VIEWS ──────────────────────────────────────────────────────────────

/**
 * DashboardView — High Fidelity Mockup Matching
 */
function DashboardView({ stats, cases, loading, onRefresh, onNav }) {
    return (
        <ScrollView
            contentContainerStyle={styles.content}
            refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} colors={[CLR.primary]} />}
        >
            <View style={styles.greetingSection}>
                <Text style={styles.welcomeText}>Welcome back, Dr.</Text>
                <Text style={styles.subGreeting}>Here's your healthcare overview for today</Text>
            </View>

            <View style={styles.statsRow}>
                {stats.map((s, idx) => (
                    <StatCard key={idx} {...s} loading={loading} />
                ))}
            </View>

            <View style={styles.panel}>
                <View style={styles.panelHeader}>
                    <Text style={styles.panelTitle}>Recent Assignments</Text>
                    <Btn style={styles.viewAllBtn} onPress={() => onNav('cases')}>
                        <Text style={styles.viewAllTxt}>View All</Text>
                        <Feather name="arrow-right" size={14} color={CLR.primary} />
                    </Btn>
                </View>

                <View style={styles.caseList}>
                    {loading ? <CaseRowSkeleton count={4} /> :
                        cases.length === 0 ? <Text style={styles.emptyTxt}>No recent activity found.</Text> :
                            cases.slice(0, 5).map((c, i) => (
                                <Pressable key={c._id} style={styles.caseRow} onPress={() => onNav('cases')}>
                                    <AvatarCircle name={c.patient?.name} size={44} idx={i} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.casePatientName}>{c.patient?.name}</Text>
                                        <Text style={styles.caseComplaint} numberOfLines={1}>{c.chiefComplaint}</Text>
                                    </View>
                                    <View style={styles.caseActionsInner}>
                                        <StatusBadge label={c.severity?.toUpperCase()} {...(PRI_MAP[c.severity?.toLowerCase()] || PRI_MAP.medium)} />
                                        <StatusBadge {...(STS_MAP[c.status] || STS_MAP.NEW)} />
                                    </View>
                                </Pressable>
                            ))
                    }
                </View>
            </View>
        </ScrollView>
    );
}

/**
 * CaseDetailsView — Full patient and complaint details
 */
function CaseDetailsView({ caseData, onBack }) {
    if (!caseData) return null;
    return (
        <ScrollView contentContainerStyle={styles.detailsContent}>
            <Pressable onPress={onBack} style={styles.backLink}>
                <Feather name="chevron-left" size={18} color={CLR.primary} />
                <Text style={styles.backLinkTxt}>Back to Cases</Text>
            </Pressable>

            <View style={styles.detailsHeaderRow}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.detailsCaseId}>{caseData.caseId}</Text>
                    <Text style={styles.detailsPatientName}>{caseData.patient?.name}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 8 }}>
                    <StatusBadge label={caseData.severity?.toUpperCase()} {...(PRI_MAP[caseData.severity?.toLowerCase()] || PRI_MAP.medium)} />
                    <StatusBadge {...(STS_MAP[caseData.status] || STS_MAP['NEW'])} />
                </View>
            </View>

            <View style={styles.detailsGrid}>
                {/* Patient Info Card */}
                <View style={styles.detailsCard}>
                    <Text style={styles.detailsCardTitle}>Patient Information</Text>
                    <View style={styles.detailsInfoRow}><Text style={styles.detailsInfoLabel}>Age/Gender</Text><Text style={styles.detailsInfoValue}>{caseData.patient?.age}y / {caseData.patient?.gender}</Text></View>
                    <View style={styles.detailsInfoRow}><Text style={styles.detailsInfoLabel}>Village</Text><Text style={styles.detailsInfoValue}>{caseData.village?.name}, {caseData.village?.district}</Text></View>
                    <View style={styles.detailsInfoRow}><Text style={styles.detailsInfoLabel}>Phone</Text><Text style={styles.detailsInfoValue}>{caseData.patient?.phone || 'N/A'}</Text></View>
                </View>

                {/* Complaint & Symptoms Card */}
                <View style={styles.detailsCard}>
                    <Text style={styles.detailsCardTitle}>Complaint & Symptoms</Text>
                    <Text style={styles.detailsInfoLabel}>Chief Complaint</Text>
                    <Text style={styles.detailsLongText}>{caseData.chiefComplaint}</Text>

                    <Text style={[styles.detailsInfoLabel, { marginTop: 16 }]}>Symptoms</Text>
                    <View style={styles.symptomTags}>
                        {(caseData.symptoms || ['Fever', 'Body Pain']).map((s, i) => (
                            <View key={i} style={styles.symptomTag}><Text style={styles.symptomTagTxt}>{s}</Text></View>
                        ))}
                    </View>
                </View>
            </View>

            <View style={[styles.detailsCard, { marginTop: 24 }]}>
                <Text style={styles.detailsCardTitle}>History & Progress</Text>
                {(caseData.statusHistory || []).map((h, i) => (
                    <View key={i} style={styles.historyRow}>
                        <View style={styles.historyDot} />
                        <View>
                            <Text style={styles.historyStatus}>{STS_MAP[h.status]?.label || h.status}</Text>
                            <Text style={styles.historyMeta}>{new Date(h.changedAt).toLocaleString()} • {h.note || 'No notes'}</Text>
                        </View>
                    </View>
                ))}
            </View>
        </ScrollView>
    );
}

/**
 * CasesView — Junior Doctor specific workflows
 */
function CasesView({ cases, loading, refreshing, onRefresh, onWriteReport, onRequestReview, onNav }) {
    const [search, setSearch] = useState('');
    const filtered = cases.filter(c =>
        c.chiefComplaint?.toLowerCase().includes(search.toLowerCase()) ||
        c.patient?.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.caseId?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <View style={styles.viewContainer}>
            <View style={styles.tableToolbar}>
                <View style={styles.tableSearch}>
                    <Feather name="search" size={18} color={CLR.textSec} style={{ marginRight: 10 }} />
                    <TextInput
                        style={[styles.tableSearchInput, NO_OUTLINE]}
                        placeholder="Search cases..."
                        value={search}
                        onChangeText={setSearch}
                        placeholderTextColor={CLR.textSec}
                    />
                </View>
                <View style={styles.filterBtn}>
                    <Feather name="filter" size={18} color={CLR.textPri} style={{ marginRight: 10 }} />
                    <Text style={styles.filterBtnTxt}>All Statuses</Text>
                    <Feather name="chevron-down" size={16} color={CLR.textSec} style={{ marginLeft: 10 }} />
                </View>
            </View>

            <View style={styles.tableWrapper}>
                <View style={styles.tableHeader}>
                    <Text style={[styles.colHeader, { width: 100 }]}>Case ID</Text>
                    <Text style={[styles.colHeader, { flex: 1.5 }]}>Patient</Text>
                    <Text style={[styles.colHeader, { flex: 1 }]}>Village</Text>
                    <Text style={[styles.colHeader, { flex: 2.5 }]}>Complaint</Text>
                    <Text style={[styles.colHeader, { width: 100, textAlign: 'center' }]}>Priority</Text>
                    <Text style={[styles.colHeader, { width: 140, textAlign: 'center' }]}>Status</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[CLR.primary]} />}
                >
                    {loading ? <CaseRowSkeleton count={8} /> :
                        filtered.length === 0 ? <Text style={styles.emptyTxt}>No assigned cases found.</Text> :
                            filtered.map((c, idx) => (
                                <Pressable key={c._id} style={styles.tr} onPress={() => onNav('details', c)}>
                                    <Text style={[styles.tdId, { width: 100 }]} numberOfLines={1}>{c.caseId || `C${String(idx + 1).padStart(3, '0')}`}</Text>
                                    <View style={[styles.tdPatient, { flex: 1.5 }]}>
                                        <Text style={styles.tdName}>{c.patient?.name}</Text>
                                    </View>
                                    <Text style={[styles.tdText, { flex: 1 }]}>{c.village?.name || 'Sundarpur'}</Text>
                                    <Text style={[styles.tdText, { flex: 2.5 }]} numberOfLines={1}>{c.chiefComplaint}</Text>
                                    <View style={{ width: 100, alignItems: 'center' }}>
                                        <StatusBadge label={c.severity === 'critical' ? 'Critical' : c.severity?.charAt(0).toUpperCase() + c.severity?.slice(1)} {...(PRI_MAP[c.severity?.toLowerCase()] || PRI_MAP.medium)} />
                                    </View>
                                    <View style={{ width: 140, alignItems: 'center' }}>
                                        <StatusBadge {...(STS_MAP[c.status] || STS_MAP['ASSIGNED'])} />
                                    </View>
                                    <Pressable style={{ width: 40, alignItems: 'center' }} onPress={() => onNav('details', c)}>
                                        <Feather name="arrow-right" size={18} color={CLR.primary} />
                                    </Pressable>
                                </Pressable>
                            ))
                    }
                </ScrollView>
            </View>
        </View>
    );
}

/**
 * PatientReviewView — Junior Doctor specific workflows
 */
function PatientReviewView({ cases, loading, refreshing, onRefresh, onSubmitReview, onRequestSenior, seniors }) {
    const pending = cases.filter(c => ['NEW', 'ASSIGNED', 'DIAGNOSED', 'FOLLOWUP', 'ESCALATED', 'SPECIALIST_REVIEW'].includes(c.status));
    const [selected, setSelected] = useState(pending[0] || null);
    const [submitting, setSubmitting] = useState(false);
    const [showSeniorList, setShowSeniorList] = useState(false);
    const [showStatusPicker, setShowStatusPicker] = useState(false);
    const [showFollowupModal, setShowFollowupModal] = useState(false);
    const [showCompleteModal, setShowCompleteModal] = useState(false); // New: Complete follow-up modal
    const [currentFollowUp, setCurrentFollowUp] = useState(null); // The follow-up being completed
    const [followupDate, setFollowupDate] = useState('');
    const [followupNotes, setFollowupNotes] = useState('');
    // Structured prescription items
    const [rxItems, setRxItems] = useState([{ medicine: '', dosage: '', frequency: '', duration: '', route: 'oral' }]);
    const [form, setForm] = useState({
        diagnosis: '', notes: '', treatmentPlan: '', dietaryAdvice: '', status: '',
        bp: '', temp: '', pulse: '', weight: ''
    });

    useEffect(() => {
        if (!selected && pending.length > 0) setSelected(pending[0]);
        if (selected) {
            setForm(f => ({ ...f, status: selected.status }));
            // Fetch pending follow-up if case is in FOLLOWUP status
            const fetchFollowUp = async () => {
                try {
                    const res = await followUpService.list({ caseId: selected._id, isCompleted: false, limit: 1 });
                    setCurrentFollowUp(res.data.data?.[0] || null);
                } catch (e) {
                    console.error('Failed to fetch follow-up info', e);
                }
            };
            fetchFollowUp();
        }
    }, [pending, selected]);

    const set = k => v => setForm(f => ({ ...f, [k]: v }));

    const addRxItem = () => setRxItems(arr => [...arr, { medicine: '', dosage: '', frequency: '', duration: '', route: 'oral' }]);
    const removeRxItem = (idx) => setRxItems(arr => arr.filter((_, i) => i !== idx));
    const setRx = (idx, field, val) => setRxItems(arr => arr.map((item, i) => i === idx ? { ...item, [field]: val } : item));

    const handleAction = async (seniorId = null) => {
        if (!selected) return;
        if (!form.diagnosis.trim() && !seniorId) {
            Toast.show({ type: 'error', text1: 'Required', text2: 'Please enter a diagnosis.' });
            return;
        }
        setSubmitting(true);
        const validRx = rxItems.filter(r => r.medicine.trim());
        try {
            if (seniorId) {
                await onRequestSenior(selected._id, {
                    seniorId,
                    patientId: selected.patient?._id,
                    diagnosis: form.diagnosis,
                    notes: form.notes,
                    treatmentPlan: form.treatmentPlan,
                    dietaryAdvice: form.dietaryAdvice,
                    prescription: validRx,
                    vitals: {
                        bloodPressure: form.bp,
                        temperature: form.temp,
                        pulse: form.pulse,
                        weight: form.weight
                    }
                });
            } else {
                // Submit diagnosis to /api/diagnoses with structured prescription
                await diagnosisService.create({
                    case: selected._id,
                    patient: selected.patient?._id,
                    finalDiagnosis: form.diagnosis,
                    notes: form.notes,
                    treatmentPlan: form.treatmentPlan,
                    dietaryAdvice: form.dietaryAdvice,
                    prescription: JSON.stringify(validRx),
                });
                // Update case status if changed
                if (form.status && form.status !== selected.status) {
                    await caseService.updateStatus(selected._id, { status: form.status });
                }
                Toast.show({ type: 'success', text1: 'Success', text2: 'Diagnosis submitted successfully.' });
                onSubmitReview();
            }
            setShowSeniorList(false);
        } catch (e) {
            Toast.show({ type: 'error', text1: 'Error', text2: e.response?.data?.error || 'Submission failed.' });
        } finally { setSubmitting(false); }
    };

    const handleCompleteFollowup = async (action) => {
        if (!currentFollowUp) return;
        setSubmitting(true);
        try {
            await followUpService.complete(currentFollowUp._id, { outcome: 'Follow-up completed via dashboard' });

            if (action === 'resolve') {
                await caseService.updateStatus(selected._id, { status: 'RESOLVED', note: 'Case resolved after follow-up' });
                Toast.show({ type: 'success', text1: 'Follow-up Complete', text2: 'Case marked as Resolved.' });
                onSubmitReview(); // Refresh
            } else {
                // Schedule another
                setShowCompleteModal(false);
                setShowFollowupModal(true);
            }
        } catch (e) {
            Toast.show({ type: 'error', text1: 'Error', text2: e.response?.data?.error || 'Completion failed.' });
        } finally {
            setSubmitting(false);
            setShowCompleteModal(false);
        }
    };

    const handleScheduleFollowup = async () => {
        if (!selected || !followupDate.trim()) {
            Toast.show({ type: 'error', text1: 'Required', text2: 'Please enter a follow-up date (YYYY-MM-DD).' });
            return;
        }
        setSubmitting(true);
        try {
            await followUpService.create({
                case: selected._id,
                patient: selected.patient?._id,
                scheduledDate: new Date(followupDate).toISOString(),
                notes: followupNotes,
            });
            Toast.show({ type: 'success', text1: 'Follow-up Scheduled', text2: `Scheduled for ${followupDate}` });
            setShowFollowupModal(false);
            setFollowupDate('');
            setFollowupNotes('');
            onRefresh();
        } catch (e) {
            Toast.show({ type: 'error', text1: 'Error', text2: e.response?.data?.error || 'Scheduling failed.' });
        } finally { setSubmitting(false); }
    };

    return (
        <View style={styles.reviewContainer}>
            {/* Sidebar: Pending Cases */}
            <View style={styles.reviewSidebar}>
                <Text style={styles.reviewSidebarTitle}>Pending Cases</Text>
                <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
                    {pending.map(c => (
                        <Pressable
                            key={c._id}
                            style={[styles.reviewCard, selected?._id === c._id && styles.reviewCardActive]}
                            onPress={() => { setSelected(c); setForm({ ...form, status: c.status }); }}
                        >
                            <View style={styles.cardHeaderRow}>
                                <Text style={styles.cardCaseName}>{c.patient?.name}</Text>
                                <StatusBadge label={c.severity?.toUpperCase()} {...(PRI_MAP[c.severity?.toLowerCase()] || PRI_MAP.medium)} />
                            </View>
                            <Text style={styles.cardCasePrompt} numberOfLines={1}>{c.chiefComplaint}</Text>
                            <StatusBadge {...(STS_MAP[c.status] || STS_MAP['ASSIGNED'])} />
                        </Pressable>
                    ))}
                    {pending.length === 0 && <Text style={styles.emptyTxt}>No pending reviews.</Text>}
                </ScrollView>
            </View>

            {/* Detail Panel */}
            {selected ? (
                <View style={{ flex: 1 }}>
                    <ScrollView style={styles.reviewDetail}>
                        <View style={styles.detailHeader}>
                            <View>
                                <Text style={styles.detailPatientName}>{selected.patient?.name}</Text>
                                <Text style={styles.detailMeta}>{selected.village?.name} • {selected.caseId || 'C001'}</Text>
                            </View>
                            <StatusBadge label={selected.severity?.toUpperCase()} {...(PRI_MAP[selected.severity?.toLowerCase()] || PRI_MAP.high)} />
                        </View>

                        <View style={styles.detailSection}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text style={styles.sectionLabel}>Complaint</Text>
                                <Text style={{ fontSize: 12, color: CLR.textSec }}>Patient Details</Text>
                            </View>
                            <Text style={styles.sectionText}>{selected.chiefComplaint}</Text>
                            <Text style={[styles.sectionLabel, { marginTop: 12 }]}>Symptoms</Text>
                            <Text style={styles.sectionText}>{selected.symptoms?.join(', ') || 'Fever, body pain, headache'}</Text>
                        </View>

                        <View style={styles.formSection}>
                            <Text style={styles.formH}>Record Vitals</Text>
                            <View style={styles.vGrid}>
                                <View style={styles.vItem}><Text style={styles.vLabel}>BP</Text><TextInput placeholder="120/80" style={styles.vInput} value={form.bp} onChangeText={set('bp')} /></View>
                                <View style={styles.vItem}><Text style={styles.vLabel}>Temp</Text><TextInput placeholder="98.6°F" style={styles.vInput} value={form.temp} onChangeText={set('temp')} /></View>
                                <View style={styles.vItem}><Text style={styles.vLabel}>Pulse</Text><TextInput placeholder="72 bpm" style={styles.vInput} value={form.pulse} onChangeText={set('pulse')} /></View>
                                <View style={styles.vItem}><Text style={styles.vLabel}>Weight</Text><TextInput placeholder="65 kg" style={styles.vInput} value={form.weight} onChangeText={set('weight')} /></View>
                            </View>

                            <Text style={styles.formH}>Diagnosis *</Text>
                            <TextInput placeholder="Enter clinical diagnosis..." style={styles.mInput} value={form.diagnosis} onChangeText={set('diagnosis')} />

                            <Text style={styles.formH}>Clinical Notes</Text>
                            <TextInput placeholder="Add detailed clinical notes..." style={[styles.mInput, { height: 80 }]} multiline value={form.notes} onChangeText={set('notes')} />

                            <Text style={styles.formH}>Treatment Plan</Text>
                            <TextInput placeholder="Treatment plan..." style={[styles.mInput, { height: 60 }]} multiline value={form.treatmentPlan} onChangeText={set('treatmentPlan')} />

                            <Text style={styles.formH}>Dietary Advice</Text>
                            <TextInput placeholder="Dietary recommendations..." style={styles.mInput} value={form.dietaryAdvice} onChangeText={set('dietaryAdvice')} />

                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 12 }}>
                                <Text style={styles.formH}>Prescription (Rx)</Text>
                                <Btn style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: CLR.primarySoft, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }} onPress={addRxItem}>
                                    <Feather name="plus" size={14} color={CLR.primary} />
                                    <Text style={{ color: CLR.primary, fontSize: 13, fontWeight: '600', marginLeft: 4 }}>Add Medicine</Text>
                                </Btn>
                            </View>
                            {rxItems.map((rx, idx) => (
                                <View key={idx} style={{ backgroundColor: '#F8FAFC', borderRadius: 10, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: CLR.border }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                                        <Text style={{ fontSize: 12, fontWeight: '700', color: CLR.textSec }}>MEDICINE {idx + 1}</Text>
                                        {rxItems.length > 1 && (
                                            <Btn onPress={() => removeRxItem(idx)}>
                                                <Feather name="x" size={14} color={CLR.danger} />
                                            </Btn>
                                        )}
                                    </View>
                                    <TextInput
                                        placeholder="Medicine name"
                                        style={[styles.vInput, { marginBottom: 6 }]}
                                        value={rx.medicine}
                                        onChangeText={v => setRx(idx, 'medicine', v)}
                                    />
                                    <View style={{ flexDirection: 'row', gap: 8 }}>
                                        <TextInput placeholder="Dosage" style={[styles.vInput, { flex: 1 }]} value={rx.dosage} onChangeText={v => setRx(idx, 'dosage', v)} />
                                        <TextInput placeholder="Frequency" style={[styles.vInput, { flex: 1 }]} value={rx.frequency} onChangeText={v => setRx(idx, 'frequency', v)} />
                                        <TextInput placeholder="Duration" style={[styles.vInput, { flex: 1 }]} value={rx.duration} onChangeText={v => setRx(idx, 'duration', v)} />
                                    </View>
                                </View>
                            ))}

                            <Text style={styles.formH}>Update Status</Text>
                            <Pressable style={styles.statusPicker} onPress={() => setShowStatusPicker(!showStatusPicker)}>
                                <Text style={{ color: CLR.textPri }}>{STS_MAP[form.status]?.label || 'Choose new status...'}</Text>
                                <Feather name="chevron-down" size={16} color={CLR.textSec} />
                            </Pressable>
                            {showStatusPicker && (
                                <View style={styles.pickerDropdown}>
                                    {['NEW', 'ASSIGNED', 'DIAGNOSED', 'FOLLOWUP', 'ESCALATED', 'SPECIALIST_REVIEW', 'RESOLVED', 'CLOSED'].map(s => (
                                        <Pressable key={s} style={styles.pickerItem} onPress={() => { set('status')(s); setShowStatusPicker(false); }}>
                                            <Text style={{ color: form.status === s ? CLR.primary : CLR.textPri }}>{STS_MAP[s]?.label || s}</Text>
                                        </Pressable>
                                    ))}
                                </View>
                            )}

                            <View style={styles.reviewActions}>
                                {currentFollowUp && (
                                    <Btn style={[styles.submitReviewBtn, { backgroundColor: CLR.success }]} onPress={() => setShowCompleteModal(true)} disabled={submitting}>
                                        <Feather name="check-circle" size={16} color="#fff" style={{ marginRight: 8 }} />
                                        <Text style={styles.submitReviewBtnText}>Mark Follow-up Complete</Text>
                                    </Btn>
                                )}
                                <Btn style={styles.submitReviewBtn} onPress={() => handleAction(null)} disabled={submitting}>
                                    <Feather name="send" size={16} color="#fff" style={{ marginRight: 8 }} />
                                    <Text style={styles.submitReviewBtnText}>{submitting ? 'Saving...' : 'Save Diagnosis'}</Text>
                                </Btn>
                                <Btn style={[styles.requestSeniorBtn, { backgroundColor: CLR.successSoft, borderColor: CLR.success }]} onPress={() => setShowFollowupModal(true)} disabled={submitting}>
                                    <Feather name="calendar" size={16} color={CLR.success} style={{ marginRight: 6 }} />
                                    <Text style={[styles.requestSeniorBtnText, { color: CLR.success }]}>Schedule Follow-up</Text>
                                </Btn>
                                <Btn style={styles.requestSeniorBtn} onPress={() => setShowSeniorList(true)} disabled={submitting}>
                                    <Feather name="share-2" size={16} color={CLR.textPri} style={{ marginRight: 8 }} />
                                    <Text style={styles.requestSeniorBtnText}>Escalate</Text>
                                </Btn>
                            </View>

                            {/* Complete Follow-up Multi-action Modal */}
                            {showCompleteModal && (
                                <View style={styles.modalOverlay}>
                                    <View style={styles.seniorModal}>
                                        <View style={styles.modalHeader}>
                                            <Text style={styles.modalTitle}>Complete Follow-up</Text>
                                            <Pressable onPress={() => setShowCompleteModal(false)}><Feather name="x" size={20} color={CLR.textSec} /></Pressable>
                                        </View>
                                        <Text style={TY.bodyMuted}>Follow-up for {selected.patient?.name} is finished. What is the next step for this case?</Text>

                                        <View style={{ gap: 12, marginTop: 24 }}>
                                            <Btn
                                                style={[styles.submitReviewBtn, { backgroundColor: CLR.success }]}
                                                onPress={() => handleCompleteFollowup('resolve')}
                                                disabled={submitting}
                                            >
                                                <Feather name="check-circle" size={16} color="#fff" style={{ marginRight: 8 }} />
                                                <Text style={styles.submitReviewBtnText}>Complete & Resolve Case</Text>
                                            </Btn>

                                            <Btn
                                                style={[styles.requestSeniorBtn, { flex: 1, backgroundColor: CLR.primarySoft, borderColor: CLR.primary }]}
                                                onPress={() => handleCompleteFollowup('next')}
                                                disabled={submitting}
                                            >
                                                <Feather name="calendar" size={16} color={CLR.primary} style={{ marginRight: 8 }} />
                                                <Text style={[styles.requestSeniorBtnText, { color: CLR.primary }]}>Complete & Schedule Another</Text>
                                            </Btn>
                                        </View>
                                    </View>
                                </View>
                            )}

                            {/* Follow-up Modal */}
                            {showFollowupModal && (
                                <View style={styles.modalOverlay}>
                                    <View style={styles.seniorModal}>
                                        <View style={styles.modalHeader}>
                                            <Text style={styles.modalTitle}>Schedule Follow-up</Text>
                                            <Pressable onPress={() => setShowFollowupModal(false)}><Feather name="x" size={20} color={CLR.textSec} /></Pressable>
                                        </View>
                                        <Text style={[styles.formH, { marginTop: 0 }]}>Follow-up Date (YYYY-MM-DD)</Text>
                                        <TextInput
                                            style={[styles.mInput, { marginBottom: 16 }]}
                                            placeholder="e.g. 2026-03-15"
                                            value={followupDate}
                                            onChangeText={setFollowupDate}
                                        />
                                        <Text style={styles.formH}>Notes</Text>
                                        <TextInput
                                            style={[styles.mInput, { height: 80, marginBottom: 20 }]}
                                            placeholder="Follow-up instructions..."
                                            value={followupNotes}
                                            onChangeText={setFollowupNotes}
                                            multiline
                                        />
                                        <Btn style={styles.submitReviewBtn} onPress={handleScheduleFollowup} disabled={submitting}>
                                            <Text style={styles.submitReviewBtnText}>{submitting ? 'Scheduling...' : 'Confirm Follow-up'}</Text>
                                        </Btn>
                                    </View>
                                </View>
                            )}
                        </View>
                    </ScrollView>

                    {showSeniorList && (
                        <View style={styles.modalOverlay}>
                            <View style={styles.seniorModal}>
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>Select Senior Doctor</Text>
                                    <Pressable onPress={() => setShowSeniorList(false)}><Feather name="x" size={20} color={CLR.textSec} /></Pressable>
                                </View>
                                <ScrollView style={{ maxHeight: 300 }}>
                                    {seniors.map(s => (
                                        <Pressable key={s._id} style={styles.seniorItem} onPress={() => handleAction(s._id)}>
                                            <AvatarCircle name={s.name} size={36} />
                                            <View>
                                                <Text style={styles.seniorName}>Dr. {s.name}</Text>
                                                <Text style={styles.seniorMeta}>{s.email}</Text>
                                            </View>
                                            <Feather name="chevron-right" size={16} color={CLR.textSec} style={{ marginLeft: 'auto' }} />
                                        </Pressable>
                                    ))}
                                </ScrollView>
                            </View>
                        </View>
                    )}
                </View>
            ) : (
                <View style={[styles.reviewDetail, { alignItems: 'center', justifyContent: 'center' }]}>
                    <Feather name="clipboard" size={48} color={CLR.border} />
                    <Text style={{ marginTop: 16, color: CLR.textSec }}>Select a case to begin review</Text>
                </View>
            )}
        </View>
    );
}

/**
 * ReportFormView
 */
function ReportFormView({ selectedCase, onCancel, onSuccess }) {
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        clinicalNotes: '', provisionalDiagnosis: '', treatmentGiven: '',
        bp: '', temp: '', pulse: '', spo2: ''
    });

    const set = k => v => setForm(f => ({ ...f, [k]: v }));

    const submit = async () => {
        if (!form.clinicalNotes.trim()) {
            Toast.show({ type: 'error', text1: 'Required', text2: 'Please enter clinical notes.' });
            return;
        }
        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('case', selectedCase._id);
            formData.append('patient', selectedCase.patient?._id);
            formData.append('clinicalNotes', form.clinicalNotes);
            formData.append('provisionalDiagnosis', form.provisionalDiagnosis);
            formData.append('treatmentGiven', form.treatmentGiven);
            formData.append('vitals', JSON.stringify({
                bloodPressure: form.bp,
                temperature: parseFloat(form.temp),
                pulse: parseInt(form.pulse),
                oxygenSaturation: parseInt(form.spo2)
            }));
            await reportService.create(formData);
            Toast.show({ type: 'success', text1: 'Success', text2: 'Visit report submitted.' });
            onSuccess();
        } catch (e) {
            Toast.show({ type: 'error', text1: 'Error', text2: e.response?.data?.error || 'Submission failed.' });
        } finally { setSubmitting(false); }
    };

    return (
        <ScrollView contentContainerStyle={styles.formContent}>
            <Pressable onPress={onCancel} style={styles.backLink}>
                <Feather name="chevron-left" size={18} color={CLR.primary} />
                <Text style={styles.backLinkTxt}>Back to Assignments</Text>
            </Pressable>

            <View style={styles.formCard}>
                <Text style={styles.formH1}>Clinical Visit Report</Text>
                <Text style={styles.formLabel}>CASE: {selectedCase.caseId} — {selectedCase.patient?.name}</Text>

                <View style={styles.complaintBox}>
                    <Text style={styles.boxLabel}>SYMPTOMS & COMPLAINT</Text>
                    <Text style={styles.boxText}>{selectedCase.chiefComplaint}</Text>
                </View>

                <Text style={styles.sectionHeading}>Patient Vitals</Text>
                <View style={styles.fGrid}>
                    <View style={styles.fItem}><Text style={styles.inputLabel}>BP (mmHg)</Text><TextInput style={styles.inputField} value={form.bp} onChangeText={set('bp')} placeholder="120/80" /></View>
                    <View style={styles.fItem}><Text style={styles.inputLabel}>Temp (°C)</Text><TextInput style={styles.inputField} value={form.temp} onChangeText={set('temp')} placeholder="37.0" keyboardType="numeric" /></View>
                    <View style={styles.fItem}><Text style={styles.inputLabel}>Pulse (bpm)</Text><TextInput style={styles.inputField} value={form.pulse} onChangeText={set('pulse')} placeholder="72" keyboardType="numeric" /></View>
                    <View style={styles.fItem}><Text style={styles.inputLabel}>SpO₂ (%)</Text><TextInput style={styles.inputField} value={form.spo2} onChangeText={set('spo2')} placeholder="98" keyboardType="numeric" /></View>
                </View>

                <Text style={styles.sectionHeading}>Observations</Text>
                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Clinical Notes *</Text>
                    <TextInput style={[styles.inputField, { height: 100, textAlignVertical: 'top', paddingTop: 12 }]} value={form.clinicalNotes} onChangeText={set('clinicalNotes')} placeholder="Describe current status..." multiline />
                </View>

                <Btn style={styles.submitCaseBtn} onPress={submit} disabled={submitting}>
                    {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitCaseBtnTxt}>Submit Report</Text>}
                </Btn>
            </View>
        </ScrollView>
    );
}

// ─── ROOT COMPONENT ───────────────────────────────────────────────────────────

export default function JuniorDoctorDashboard() {
    const { user, logout } = useAuth();
    const [nav, setNav] = useState('dashboard');
    const [cases, setCases] = useState([]);
    const [seniors, setSeniors] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedCase, setSelectedCase] = useState(null);

    const loadData = useCallback(async () => {
        try {
            const [cRes, aRes, uRes] = await Promise.all([
                caseService.list({ limit: 50 }),
                analyticsService.summary().catch(() => ({ data: { data: null } })),
                userService.list({ role: 'senior_doctor' }).catch(() => ({ data: { data: [] } }))
            ]);
            setCases(cRes.data.data || []);
            setAnalytics(aRes.data.data);
            setSeniors(uRes.data.data || []);
        } catch {
            Toast.show({ type: 'error', text1: 'Snyc Fail', text2: 'Could not fetch data.' });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const handleReviewSubmit = async (data) => {
        try {
            // Post structured diagnosis with prescription array
            await diagnosisService.create({
                case: data.caseId,
                patient: data.patientId,
                finalDiagnosis: data.diagnosis,
                prescription: JSON.stringify(data.prescription || []),
                notes: data.notes,
                treatmentPlan: data.treatmentPlan,
                dietaryAdvice: data.dietaryAdvice,
            });
            Toast.show({ type: 'success', text1: 'Diagnosis Saved', text2: 'Diagnosis and prescription have been recorded.' });
            loadData();
        } catch (e) {
            Toast.show({ type: 'error', text1: 'Error', text2: e.response?.data?.error || 'Submission failed.' });
        }
    };

    const handleEscalateWithData = async (cid, data) => {
        try {
            // Save diagnosis first if there is one
            if (data.diagnosis?.trim()) {
                await diagnosisService.create({
                    case: cid,
                    patient: data.patientId,
                    finalDiagnosis: data.diagnosis,
                    prescription: JSON.stringify(data.prescription || []),
                    notes: data.notes,
                    treatmentPlan: data.treatmentPlan,
                    dietaryAdvice: data.dietaryAdvice,
                    vitals: JSON.stringify(data.vitals || {})
                });
            }
            await caseService.requestSeniorReview(cid, { seniorId: data.seniorId });
            Toast.show({ type: 'success', text1: 'Escalated', text2: 'Case escalated to Senior Doctor.' });
            loadData();
        } catch (e) {
            Toast.show({ type: 'error', text1: 'Error', text2: e.response?.data?.error || 'Escalation failed.' });
        }
    };

    const onNavDetail = (targetNav, cData) => {
        setSelectedCase(cData);
        setNav(targetNav);
    };

    const stats = useMemo(() => [
        { label: 'TOTAL CASES', value: analytics?.totalCases || 6, icon: <Feather name="clipboard" size={20} color={CLR.primary} />, bg: CLR.primaryTint },
        { label: 'ACTIVE CASES', value: analytics?.activeCases || 4, icon: <MaterialCommunityIcons name="heart-pulse" size={20} color={CLR.warning} />, bg: '#FFFBEB' },
        { label: 'CRITICAL', value: analytics?.severityBreakdown?.critical || 1, icon: <Feather name="alert-triangle" size={18} color={CLR.danger} />, bg: '#FEF2F2' },
        { label: 'VILLAGES', value: analytics?.villageCount || 4, icon: <Feather name="home" size={20} color={CLR.success} />, bg: '#F0FDF4' },
    ], [analytics]);

    return (
        <View style={styles.root}>
            {/* SIDEBAR */}
            <View style={styles.sidebar}>
                <View style={styles.sidebarHeader}>
                    <View style={[styles.logoCircle, { backgroundColor: 'transparent', shadowOpacity: 0 }]}>
                        <FontAwesome5 name="heart" size={18} color="#000" style={{ position: 'absolute' }} />
                        <FontAwesome5 name="heartbeat" size={18} color="#6366F1" />
                    </View>
                    <View>
                        <Text style={styles.logoName}>Rural Health</Text>
                        <Text style={styles.logoTag}>CONNECT</Text>
                    </View>
                </View>

                <View style={styles.sidebarContent}>
                    <Text style={styles.sidebarHeading}>NAVIGATION</Text>
                    <SidebarItem icon="grid" label="Dashboard" active={nav === 'dashboard'} onPress={() => setNav('dashboard')} />
                    <SidebarItem icon="briefcase" label="My Cases" active={nav === 'cases'} onPress={() => setNav('cases')} />
                    <SidebarItem icon="users" label="Patient Review" active={nav === 'review'} onPress={() => setNav('review')} />
                </View>

                <View style={styles.sidebarFooter}>
                    <View style={styles.userCard}>
                        <View style={styles.userAvatar}>
                            <Text style={styles.userInitials}>{user?.name?.[0]}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.userName}>Dr. {user?.name}</Text>
                            <Text style={styles.userRole}>Junior Doctor</Text>
                        </View>
                    </View>
                    <Btn style={styles.signOutBtn} onPress={logout}>
                        <Feather name="log-out" size={18} color={CLR.danger} />
                        <Text style={styles.signOutTxt}>Sign Out</Text>
                    </Btn>
                </View>
            </View>

            {/* MAIN AREA */}
            <View style={styles.main}>
                <TopHeader user={user} onSelectCase={(c) => { setSelectedCase(c); setNav('details'); }} />
                {nav === 'dashboard' ? (
                    <DashboardView stats={stats} cases={cases} loading={loading} onRefresh={loadData} onNav={setNav} />
                ) : nav === 'cases' ? (
                    <CasesView
                        cases={cases}
                        loading={loading}
                        refreshing={refreshing}
                        onRefresh={() => { setRefreshing(true); loadData(); }}
                        onWriteReport={(c) => { setSelectedCase(c); setNav('report'); }}
                        onNav={onNavDetail}
                        onRequestReview={handleEscalateWithData}
                    />
                ) : nav === 'review' ? (
                    <PatientReviewView
                        cases={cases}
                        seniors={seniors}
                        loading={loading}
                        refreshing={refreshing}
                        onRefresh={() => { setRefreshing(true); loadData(); }}
                        onSubmitReview={handleReviewSubmit}
                        onRequestSenior={handleEscalateWithData}
                    />
                ) : nav === 'details' && selectedCase ? (
                    <CaseDetailsView
                        caseData={selectedCase}
                        onBack={() => { setSelectedCase(null); setNav('cases'); }}
                    />
                ) : nav === 'report' && selectedCase ? (
                    <ReportFormView
                        selectedCase={selectedCase}
                        onCancel={() => { setSelectedCase(null); setNav('cases'); }}
                        onSuccess={() => { setSelectedCase(null); setNav('cases'); loadData(); }}
                    />
                ) : null}
            </View>
        </View>
    );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    root: { flex: 1, flexDirection: 'row', backgroundColor: CLR.bg },
    sidebar: { width: 280, backgroundColor: CLR.sidebarBg, padding: 24, justifyContent: 'space-between' },
    main: { flex: 1 },

    // Sidebar
    sidebarHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 40 },
    logoCircle: { width: 44, height: 44, borderRadius: 14, backgroundColor: CLR.primary, alignItems: 'center', justifyContent: 'center', ...SHADOW.md },
    logoName: { color: '#F1F5F9', fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
    logoTag: { color: CLR.sidebarText, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
    sidebarContent: { flex: 1 },
    sidebarHeading: { color: '#64748B', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 16, marginTop: 16 },
    navItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 16, borderRadius: 12, gap: 12, marginBottom: 4 },
    navItemActive: { backgroundColor: CLR.sidebarActive },
    navLabel: { color: CLR.sidebarText, fontSize: 14, fontWeight: '600' },
    navLabelActive: { color: CLR.sidebarTextActive },
    sidebarFooter: { marginTop: 'auto', gap: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)', paddingTop: 16 },
    userCard: { flexDirection: 'row', alignItems: 'center', padding: 10, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, gap: 12 },
    userAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: CLR.primary, alignItems: 'center', justifyContent: 'center' },
    userInitials: { color: '#fff', fontSize: 14, fontWeight: '700' },
    userName: { color: '#F1F5F9', fontSize: 13, fontWeight: '700' },
    userRole: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '600' },
    signOutBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, gap: 10, borderRadius: 10 },
    signOutTxt: { color: '#F87171', fontSize: 13, fontWeight: '600' },

    // Dashboard View
    content: { padding: 32 },
    greetingSection: { marginBottom: 32 },
    welcomeText: { fontSize: 24, fontWeight: '800', color: CLR.textPri, letterSpacing: -0.5 },
    subGreeting: { fontSize: 15, color: CLR.textSec, marginTop: 4 },
    statsRow: { flexDirection: 'row', gap: 16, marginBottom: 32 },
    statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', ...SHADOW.sm },
    statLabel: { color: CLR.textSec, fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
    statValue: { color: CLR.textPri, fontSize: 28, fontWeight: '700', marginTop: 8 },
    statTrend: { fontSize: 12, fontWeight: '600', color: CLR.success, marginTop: 8 },
    statIconCircle: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    panel: { backgroundColor: '#fff', borderRadius: 20, padding: 24, ...SHADOW.md },
    panelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
    panelTitle: { fontSize: 18, fontWeight: '700', color: CLR.textPri },
    viewAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    viewAllTxt: { fontSize: 14, fontWeight: '600', color: CLR.textSec },
    caseList: { gap: 10 },
    caseRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', gap: 16 },
    casePatientName: { fontSize: 15, fontWeight: '600', color: CLR.textPri },
    caseComplaint: { fontSize: 13, color: CLR.textSec, marginTop: 2 },
    caseActionsInner: { flexDirection: 'row', gap: 8 },

    // Workstation common
    viewContainer: { flex: 1 },
    viewHeader: { padding: 32, paddingBottom: 16 },
    viewTitle: { fontSize: 22, fontWeight: '700', color: CLR.textPri },
    viewSubtitle: { fontSize: 14, color: CLR.textSec, marginTop: 4 },

    // Cases View (Image 1 Table Style)
    tableToolbar: { flexDirection: 'row', gap: 16, padding: 32, paddingBottom: 16 },
    tableSearch: { flex: 1, height: 48, backgroundColor: CLR.bg, borderRadius: 12, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, borderWidth: 1, borderColor: CLR.border },
    tableSearchInput: { flex: 1, fontSize: 14, color: CLR.textPri },
    filterBtn: { height: 48, backgroundColor: '#fff', borderRadius: 12, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, borderWidth: 1, borderColor: CLR.border },
    filterBtnTxt: { fontSize: 14, fontWeight: '600', color: CLR.textPri },

    tableWrapper: { flex: 1, marginHorizontal: 32, marginBottom: 32, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: CLR.border, overflow: 'hidden', ...SHADOW.sm },
    tableHeader: { flexDirection: 'row', paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: CLR.border, backgroundColor: CLR.bg },
    colHeader: { fontSize: 13, fontWeight: '600', color: CLR.textSec, textTransform: 'uppercase', letterSpacing: 0.5 },

    tr: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    tdId: { fontSize: 13, fontWeight: '700', color: CLR.textSec, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
    tdPatient: { flexDirection: 'row', alignItems: 'center' },
    tdName: { fontSize: 14, fontWeight: '700', color: CLR.textPri },
    tdText: { fontSize: 14, color: CLR.textSec },

    // Top Header
    topHeader: { height: 80, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: CLR.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 32, zIndex: 100 },
    headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    globalSearch: { width: 320, height: 40, backgroundColor: '#F1F5F9', borderRadius: 10, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 },
    globalSearchInput: { flex: 1, fontSize: 14, color: CLR.textPri },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 20 },
    roleSwitcher: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: CLR.border },
    roleSwitcherTxt: { fontSize: 14, fontWeight: '600', color: CLR.textPri },
    notifBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    notifBadge: { position: 'absolute', top: 6, right: 6, width: 16, height: 16, borderRadius: 8, backgroundColor: CLR.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
    notifBadgeTxt: { color: '#fff', fontSize: 9, fontWeight: '800' },

    // Form View
    formContent: { padding: 40, alignItems: 'center' },
    backLink: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', marginBottom: 24 },
    backLinkTxt: { fontSize: 15, fontWeight: '600', color: CLR.primary, marginLeft: 4 },
    formCard: { backgroundColor: '#fff', width: '100%', maxWidth: 700, borderRadius: 24, padding: 40, ...SHADOW.md },
    formH1: { fontSize: 24, fontWeight: '700', color: CLR.textPri, marginBottom: 8 },
    formLabel: { fontSize: 13, fontWeight: '600', color: CLR.primary, marginBottom: 32 },
    complaintBox: { backgroundColor: '#F8FAFC', padding: 20, borderRadius: 16, marginBottom: 32, borderLeftWidth: 4, borderLeftColor: CLR.primary },
    boxLabel: { fontSize: 11, fontWeight: '800', color: CLR.primary, letterSpacing: 1 },
    boxText: { fontSize: 15, color: '#334155', marginTop: 10, lineHeight: 22 },
    sectionHeading: { fontSize: 16, fontWeight: '700', color: CLR.textPri, marginBottom: 16, marginTop: 12 },
    fGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 24 },
    fItem: { width: '47%' },
    inputGroup: { marginBottom: 24 },
    inputLabel: { fontSize: 14, fontWeight: '600', color: '#1E293B', marginBottom: 10 },
    inputField: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: CLR.border, borderRadius: 12, height: 50, paddingHorizontal: 16, fontSize: 15, color: CLR.textPri },
    submitCaseBtn: { backgroundColor: CLR.primary, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 8, ...SHADOW.md },
    submitCaseBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },

    // Global
    badgePill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    badgeTxt: { fontSize: 12, fontWeight: '600' },
    statIconCircle: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    emptyTxt: { textAlign: 'center', color: CLR.textSec, padding: 40, fontWeight: '500' },

    // Patient Review (Image-led Master-Detail)
    reviewContainer: { flex: 1, flexDirection: 'row', backgroundColor: CLR.bg },
    reviewSidebar: { width: 340, backgroundColor: '#fff', borderRightWidth: 1, borderRightColor: CLR.border, padding: 24 },
    reviewSidebarTitle: { fontSize: 18, fontWeight: '700', color: CLR.textPri, marginBottom: 20 },
    reviewCard: { padding: 16, borderRadius: 16, backgroundColor: '#F8FAFC', marginBottom: 16, borderWidth: 1, borderColor: 'transparent' },
    reviewCardActive: { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' },
    cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    cardCaseName: { fontSize: 15, fontWeight: '700', color: CLR.textPri },
    cardCasePrompt: { fontSize: 13, color: CLR.textSec, marginBottom: 12 },

    reviewDetail: { flex: 1, backgroundColor: '#fff' },
    detailHeader: { padding: 32, borderBottomWidth: 1, borderBottomColor: CLR.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    detailPatientName: { fontSize: 24, fontWeight: '700', color: CLR.textPri },
    detailMeta: { fontSize: 14, color: CLR.textSec, marginTop: 4 },
    detailSection: { padding: 32, backgroundColor: '#F8FAFC' },
    sectionLabel: { fontSize: 11, fontWeight: '800', color: CLR.textSec, textTransform: 'uppercase', letterSpacing: 1 },
    sectionText: { fontSize: 15, color: CLR.textPri, marginTop: 8, lineHeight: 22 },

    formSection: { padding: 32 },
    formH: { fontSize: 14, fontWeight: '700', color: CLR.textPri, marginBottom: 12, marginTop: 24 },
    vGrid: { flexDirection: 'row', gap: 16 },
    vItem: { flex: 1 },
    vLabel: { fontSize: 12, fontWeight: '600', color: CLR.textSec, marginBottom: 6 },
    vInput: { height: 44, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: CLR.border, borderRadius: 10, paddingHorizontal: 12, fontSize: 14, color: CLR.textPri },
    mInput: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: CLR.border, borderRadius: 12, padding: 12, fontSize: 14, color: CLR.textPri, textAlignVertical: 'top' },
    statusPicker: { height: 48, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: CLR.border, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },

    reviewActions: { flexDirection: 'row', gap: 16, marginTop: 32 },
    submitReviewBtn: { flex: 1, height: 52, backgroundColor: CLR.primary, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    submitReviewBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
    requestSeniorBtn: { flex: 0.6, height: 52, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: CLR.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    requestSeniorBtnText: { color: CLR.textPri, fontSize: 14, fontWeight: '600' },

    // Case Details Styles
    detailsContent: { padding: 32 },
    detailsHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
    detailsCaseId: { fontSize: 12, fontWeight: '800', color: CLR.primary, letterSpacing: 1, marginBottom: 4 },
    detailsPatientName: { fontSize: 32, fontWeight: '700', color: CLR.textPri },
    detailsGrid: { flexDirection: 'row', gap: 24 },
    detailsCard: { flex: 1, backgroundColor: '#fff', borderRadius: 20, padding: 24, ...SHADOW.sm },
    detailsCardTitle: { fontSize: 16, fontWeight: '700', color: CLR.textPri, marginBottom: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: CLR.border },
    detailsInfoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    detailsInfoLabel: { fontSize: 13, color: CLR.textSec, fontWeight: '500' },
    detailsInfoValue: { fontSize: 14, color: CLR.textPri, fontWeight: '600' },
    detailsLongText: { fontSize: 15, color: CLR.textPri, marginTop: 8, lineHeight: 22 },
    symptomTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
    symptomTag: { backgroundColor: CLR.primarySoft, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    symptomTagTxt: { color: CLR.primary, fontSize: 12, fontWeight: '600' },
    historyRow: { flexDirection: 'row', gap: 16, marginBottom: 20 },
    historyDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: CLR.primary, marginTop: 6 },
    historyStatus: { fontSize: 14, fontWeight: '700', color: CLR.textPri },
    historyMeta: { fontSize: 12, color: CLR.textSec, marginTop: 2 },

    // Pickers & Modals
    pickerDropdown: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: CLR.border, marginTop: 4, overflow: 'hidden', ...SHADOW.sm },
    pickerItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
    modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
    seniorModal: { width: 400, backgroundColor: '#fff', borderRadius: 24, padding: 24, ...SHADOW.lg },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 18, fontWeight: '700', color: CLR.textPri },
    seniorItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#F1F5F9' },
    seniorName: { fontSize: 14, fontWeight: '700', color: CLR.textPri },
    seniorMeta: { fontSize: 12, color: CLR.textSec },
});

/**
 * app/dashboard/senior-doctor.jsx
 * Senior Doctor Dashboard — Full Navigation & View-Switcher Implementation
 * Correctly matches Image 1 design while providing full sidebar functionality.
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TextInput,
    ActivityIndicator, RefreshControl, Platform, Pressable, FlatList, Linking
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useAuth } from '../../context/AuthContext';
import { caseService, diagnosisService, analyticsService, followUpService } from '../../services/api';
import { StatCardSkeleton, CaseRowSkeleton } from '../../components/ui/Skeleton';
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

function Btn({ style, onPress, disabled, children }) {
    return (
        <Pressable onPress={onPress} disabled={disabled} style={style}>
            {children}
        </Pressable>
    );
}

function StatusBadge({ label, txt, bg, dot }) {
    return (
        <View style={[styles.badgePill, { backgroundColor: bg }]}>
            {dot && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: dot, marginRight: 6 }} />}
            <Text style={[styles.badgeTxt, { color: txt }]}>{label}</Text>
        </View>
    );
}

function StatCard({ label, value, icon, color, bg, loading }) {
    if (loading) return <StatCardSkeleton />;
    return (
        <View style={styles.statCard}>
            <View style={{ flex: 1 }}>
                <Text style={styles.statLabel}>{label}</Text>
                <Text style={styles.statValue}>{value ?? '0'}</Text>
            </View>
            <View style={[styles.statIconCircle, { backgroundColor: bg }]}>
                {icon}
            </View>
        </View>
    );
}

function CaseRowItem({ c, onOpen }) {
    const pri = PRI_MAP[c.severity?.toLowerCase()] || PRI_MAP.medium;
    const sts = STS_MAP[c.status] || STS_MAP['NEW'];

    return (
        <Pressable style={styles.caseRow} onPress={() => onOpen(c)}>
            <View style={styles.patientAvatar}>
                <Text style={styles.avatarTxt}>{c.patient?.name?.[0]?.toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.casePatientName}>{c.patient?.name}</Text>
                <Text style={[styles.caseComplaint, { fontSize: 12, color: CLR.primary, fontWeight: '600', marginTop: 1 }]}>{c.caseId}</Text>
                <Text style={styles.caseComplaint} numberOfLines={1}>{c.chiefComplaint}</Text>
            </View>
            <View style={styles.caseActions}>
                <StatusBadge {...pri} />
                <StatusBadge {...sts} />
                <Feather name="chevron-right" size={16} color={CLR.textSec} />
            </View>
        </Pressable>
    );
}

function SidebarItem({ icon, label, active, onPress }) {
    return (
        <Pressable
            onPress={onPress}
            style={[styles.navItem, active && styles.navItemActive]}
        >
            <Feather name={icon} size={18} color={active ? '#FFFFFF' : '#94A3B8'} />
            <Text style={[styles.navLabel, active && styles.navLabelActive]}>{label}</Text>
        </Pressable>
    );
}

// ─── VIEW COMPONENTS ──────────────────────────────────────────────────────────

/**
 * DashboardView — Overview with quick actions + clickable recent cases
 */
function DashboardView({ stats, cases, loading, onRefresh, onNav, onOpenCase, myCases, reviewQueue }) {
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

            {/* Quick Actions */}
            <View style={styles.quickActions}>
                <Pressable style={[styles.qaCard, { borderLeftColor: CLR.primary }]} onPress={() => onNav('cases')}>
                    <Feather name="briefcase" size={20} color={CLR.primary} />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.qaTitle}>My Cases</Text>
                        <Text style={styles.qaSub}>{myCases.length} patient{myCases.length !== 1 ? 's' : ''} under your care</Text>
                    </View>
                    <Feather name="chevron-right" size={16} color={CLR.textSec} />
                </Pressable>
                <Pressable style={[styles.qaCard, { borderLeftColor: CLR.danger }]} onPress={() => onNav('review')}>
                    <Feather name="users" size={20} color={CLR.danger} />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.qaTitle}>Escalated Reviews</Text>
                        <Text style={styles.qaSub}>{reviewQueue.length} case{reviewQueue.length !== 1 ? 's' : ''} awaiting specialist opinion</Text>
                    </View>
                    <Feather name="chevron-right" size={16} color={CLR.textSec} />
                </Pressable>
            </View>

            <View style={styles.panel}>
                <View style={styles.panelHeader}>
                    <Text style={styles.panelTitle}>Recent Cases</Text>
                    <Pressable style={styles.viewAllBtn} onPress={() => onNav('tracking')}>
                        <Text style={styles.viewAllTxt}>View All</Text>
                        <Feather name="arrow-right" size={14} color="#64748B" />
                    </Pressable>
                </View>

                <View style={styles.caseList}>
                    {loading ? <CaseRowSkeleton count={4} /> :
                        cases.length === 0 ? <Text style={styles.emptyTxt}>No recent activity found.</Text> :
                            cases.slice(0, 6).map(c => <CaseRowItem key={c._id} c={c} onOpen={onOpenCase} />)
                    }
                </View>
            </View>
        </ScrollView>
    );
}

/**
 * PatientReviewView — Specialist Task Queue (Clinical Consolidation)
 */
function PatientReviewView({ cases, loading, onRefresh, onReview }) {
    const [search, setSearch] = useState('');
    const filtered = cases.filter(c =>
        c.patient?.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.caseId?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <View style={styles.viewContainer}>
            <View style={styles.viewHeader}>
                <Text style={styles.viewTitle}>Patient Review Queue</Text>
                <Text style={styles.viewSubtitle}>Diagnose cases escalated for expert opinion</Text>
            </View>

            <View style={styles.searchBarStrip}>
                <Feather name="search" size={18} color="#94A3B8" />
                <TextInput
                    style={[styles.stripedSearch, NO_OUTLINE]}
                    placeholder="Search by patient or ID..."
                    value={search}
                    onChangeText={setSearch}
                />
            </View>

            <ScrollView
                contentContainerStyle={{ padding: 24 }}
                refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} colors={[CLR.primary]} />}
            >
                {loading ? <CaseRowSkeleton count={5} /> :
                    filtered.length === 0 ? <Text style={styles.emptyTxt}>Clean slate! No pending reviews.</Text> :
                        filtered.map(c => (
                            <Pressable key={c._id} style={styles.workstationCard} onPress={() => onReview(c)}>
                                <View style={styles.cardTop}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.cardPatientName}>{c.patient?.name}</Text>
                                        <Text style={styles.cardCaseId}>{c.caseId}</Text>
                                    </View>
                                    <StatusBadge {...(PRI_MAP[c.severity?.toLowerCase()] || PRI_MAP.medium)} />
                                </View>
                                <Text style={styles.cardComplaint}>{c.chiefComplaint}</Text>
                                <View style={styles.cardFooter}>
                                    <Text style={styles.footerMeta}>Village: {c.village?.name || '—'}  •  Junior Dr: {c.assignedTo?.name || 'Staff'}</Text>
                                    <View style={{ flexDirection: 'row', gap: 8 }}>
                                        <View style={styles.actionBtnSmall}>
                                            <Text style={styles.actionBtnTxtSmall}>Provide Diagnosis</Text>
                                        </View>
                                        <Btn
                                            style={[styles.actionBtnSmall, { backgroundColor: CLR.success }]}
                                            onPress={async () => {
                                                try {
                                                    const res = await diagnosisService.getForCase(c._id);
                                                    const diag = res.data.data?.[0];
                                                    if (!diag) throw new Error('No diagnosis found.');
                                                    const pdfUrl = diagnosisService.getPdfUrl(diag._id);
                                                    Linking.openURL(pdfUrl);
                                                } catch (e) {
                                                    Toast.show({ type: 'error', text1: 'Error', text2: 'No clinical report available yet.' });
                                                }
                                            }}
                                        >
                                            <Feather name="download" size={14} color="#fff" />
                                        </Btn>
                                    </View>
                                </View>
                            </Pressable>
                        ))
                }
            </ScrollView>
        </View>
    );
}

/**
 * MyCasesView — Cases directly assigned to this senior doctor.
 * Uses full workstation cards with Provide Diagnosis action.
 */
function MyCasesView({ cases, loading, onRefresh, onDiagnose }) {
    const [search, setSearch] = useState('');
    const filtered = cases.filter(c =>
        c.patient?.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.caseId?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <View style={styles.viewContainer}>
            <View style={styles.viewHeader}>
                <Text style={styles.viewTitle}>My Assigned Cases</Text>
                <Text style={styles.viewSubtitle}>Patients directly under your care — tap a card to provide diagnosis</Text>
            </View>

            <View style={styles.searchBarStrip}>
                <Feather name="search" size={18} color="#94A3B8" />
                <TextInput
                    style={[styles.stripedSearch, NO_OUTLINE]}
                    placeholder="Search by patient or Case ID..."
                    value={search}
                    onChangeText={setSearch}
                />
            </View>

            <ScrollView
                contentContainerStyle={{ padding: 24 }}
                refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} colors={[CLR.primary]} />}
            >
                {loading ? <CaseRowSkeleton count={5} /> :
                    filtered.length === 0 ?
                        <View style={{ alignItems: 'center', padding: 40 }}>
                            <Feather name="briefcase" size={40} color="#CBD5E1" style={{ marginBottom: 12 }} />
                            <Text style={styles.emptyTxt}>{search ? 'No cases match your search.' : 'No cases directly assigned to you yet.'}</Text>
                        </View>
                        :
                        filtered.map(c => (
                            <Pressable key={c._id} style={styles.workstationCard} onPress={() => onDiagnose(c)}>
                                <View style={styles.cardTop}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.cardPatientName}>{c.patient?.name}</Text>
                                        <Text style={styles.cardCaseId}>{c.caseId}</Text>
                                    </View>
                                    <StatusBadge {...(PRI_MAP[c.severity?.toLowerCase()] || PRI_MAP.medium)} />
                                </View>
                                <Text style={styles.cardComplaint}>{c.chiefComplaint}</Text>
                                <View style={styles.cardFooter}>
                                    <Text style={styles.footerMeta}>
                                        Village: {c.village?.name || '—'}  •  Status: {STS_MAP[c.status]?.label || c.status}
                                    </Text>
                                    <View style={styles.actionBtnSmall}>
                                        <Text style={styles.actionBtnTxtSmall}>Provide Diagnosis →</Text>
                                    </View>
                                </View>
                            </Pressable>
                        ))
                }
            </ScrollView>
        </View>
    );
}

/**
 * CaseTrackingView — Full audit log with status filter and clickable rows
 */
function CaseTrackingView({ cases, loading, onRefresh, onOpenCase }) {
    const [statusFilter, setStatusFilter] = useState('ALL');
    const STATUS_OPTIONS = ['ALL', 'NEW', 'ASSIGNED', 'DIAGNOSED', 'ESCALATED', 'SPECIALIST_REVIEW', 'RESOLVED', 'CLOSED'];
    const filtered = statusFilter === 'ALL' ? cases : cases.filter(c => c.status === statusFilter);

    return (
        <View style={styles.viewContainer}>
            <View style={styles.viewHeader}>
                <Text style={styles.viewTitle}>Case Tracking & Audits</Text>
                <Text style={styles.viewSubtitle}>Monitor treatment progress across all villages</Text>
            </View>

            {/* Status filter tabs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 48, paddingHorizontal: 24, marginBottom: 8 }} contentContainerStyle={{ gap: 8, alignItems: 'center' }}>
                {STATUS_OPTIONS.map(s => (
                    <Pressable
                        key={s}
                        onPress={() => setStatusFilter(s)}
                        style={[styles.filterPill, statusFilter === s && styles.filterPillActive]}
                    >
                        <Text style={[styles.filterPillTxt, statusFilter === s && styles.filterPillTxtActive]}>
                            {s === 'ALL' ? 'All Cases' : (STS_MAP[s]?.label || s)}
                        </Text>
                    </Pressable>
                ))}
            </ScrollView>

            <View style={styles.tableHead}>
                <Text style={[styles.th, { flex: 1.5 }]}>Case ID</Text>
                <Text style={[styles.th, { flex: 2 }]}>Patient</Text>
                <Text style={[styles.th, { flex: 2 }]}>Status</Text>
                <Text style={[styles.th, { flex: 1.5 }]}>Priority</Text>
                <Text style={[styles.th, { flex: 1.5 }]}>Village</Text>
                <Text style={[styles.th, { flex: 2 }]}>Assigned To</Text>
            </View>
            <ScrollView
                contentContainerStyle={{ paddingBottom: 40 }}
                refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} colors={[CLR.primary]} />}
            >
                {loading ? <CaseRowSkeleton count={8} /> :
                    filtered.length === 0 ?
                        <Text style={styles.emptyTxt}>No cases with status "{statusFilter}".</Text>
                        :
                        filtered.map(c => (
                            <Pressable key={c._id} style={styles.tableRow} onPress={() => onOpenCase(c)}>
                                <Text style={[styles.td, { flex: 1.5, color: CLR.primary, fontWeight: '700' }]}>{c.caseId}</Text>
                                <Text style={[styles.td, { flex: 2, fontWeight: '600' }]}>{c.patient?.name}</Text>
                                <View style={{ flex: 2, flexDirection: 'row' }}><StatusBadge {...(STS_MAP[c.status] || STS_MAP['NEW'])} /></View>
                                <View style={{ flex: 1.5, flexDirection: 'row' }}><StatusBadge {...(PRI_MAP[c.severity?.toLowerCase()] || PRI_MAP.low)} /></View>
                                <Text style={[styles.td, { flex: 1.5 }]}>{c.village?.name || '—'}</Text>
                                <View style={{ flex: 2 }}><Text style={[styles.td, { color: CLR.textSec }]} numberOfLines={1}>{c.assignedTo?.name || '—'}</Text></View>
                            </Pressable>
                        ))
                }
            </ScrollView>
        </View>
    );
}

/**
 * DiagnosisFormView — Form for providing clinical diagnosis
 * backTo: which tab to navigate back to ('cases' or 'review')
 */
function DiagnosisFormView({ selectedCase, onCancel, onSuccess, backTo }) {
    const isPrimaryCare = backTo === 'cases';

    const [submitting, setSubmitting] = useState(false);
    const [closeCase, setCloseCase] = useState(true);
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const [currentFollowUp, setCurrentFollowUp] = useState(null);
    const [form, setForm] = useState({
        finalDiagnosis: '', severity: selectedCase.severity || 'medium',
        treatmentPlan: '', dietaryAdvice: '', followupDate: ''
    });
    const [rxItems, setRxItems] = useState([{ medicine: '', dosage: '', frequency: '', duration: '', route: 'oral' }]);

    useEffect(() => {
        const fetchFollowUp = async () => {
            try {
                const res = await followUpService.list({ caseId: selectedCase._id, isCompleted: false, limit: 1 });
                setCurrentFollowUp(res.data.data?.[0] || null);
            } catch (e) {
                console.error('Failed to fetch follow-up info', e);
            }
        };
        fetchFollowUp();
    }, [selectedCase._id]);

    const handleCompleteFollowup = async (action) => {
        if (!currentFollowUp) return;
        setSubmitting(true);
        try {
            await followUpService.complete(currentFollowUp._id, { outcome: 'Follow-up completed via Senior Dashboard' });
            if (action === 'resolve') {
                await caseService.updateStatus(selectedCase._id, { status: 'RESOLVED', note: 'Case resolved after senior follow-up' });
                Toast.show({ type: 'success', text1: 'Success', text2: 'Case marked as Resolved.' });
                onSuccess();
            } else {
                // Keep under review for next follow-up/diagnosis
                setShowCompleteModal(false);
                Toast.show({ type: 'success', text1: 'Follow-up Marked Complete', text2: 'Continue with your diagnosis/plan.' });
                loadData();
            }
        } catch (e) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to complete follow-up.' });
        } finally {
            setSubmitting(false);
            setShowCompleteModal(false);
        }
    };

    const set = k => v => setForm(f => ({ ...f, [k]: v }));
    const addRxItem = () => setRxItems(arr => [...arr, { medicine: '', dosage: '', frequency: '', duration: '', route: 'oral' }]);
    const removeRxItem = (idx) => setRxItems(arr => arr.filter((_, i) => i !== idx));
    const setRx = (idx, field, val) => setRxItems(arr => arr.map((item, i) => i === idx ? { ...item, [field]: val } : item));

    const submit = async () => {
        if (!form.finalDiagnosis.trim()) {
            Toast.show({ type: 'error', text1: 'Required', text2: 'Please enter final diagnosis.' });
            return;
        }
        setSubmitting(true);
        try {
            const validRx = rxItems.filter(r => r.medicine.trim());
            await diagnosisService.create({
                case: selectedCase._id,
                patient: selectedCase.patient?._id,
                finalDiagnosis: form.finalDiagnosis,
                severity: form.severity,
                treatmentPlan: form.treatmentPlan,
                dietaryAdvice: form.dietaryAdvice,
                prescription: JSON.stringify(validRx),
            });
            // contextual status handling
            let finalStatus;
            if (isPrimaryCare) {
                finalStatus = closeCase ? 'RESOLVED' : 'DIAGNOSED';
            } else {
                finalStatus = closeCase ? 'RESOLVED' : 'SPECIALIST_REVIEW';
            }

            // Schedule follow-up if date is provided and case is not resolved
            if (!closeCase && form.followupDate.trim()) {
                await followUpService.create({
                    case: selectedCase._id,
                    patient: selectedCase.patient?._id,
                    scheduledDate: new Date(form.followupDate).toISOString(),
                    notes: `Senior clinical follow-up scheduled.`,
                });
            }

            // Also resolve/close the case
            await caseService.updateStatus(selectedCase._id, {
                status: finalStatus,
                note: `Senior specialist diagnosis: ${form.finalDiagnosis}`,
            });
            Toast.show({ type: 'success', text1: 'Success', text2: closeCase ? 'Case resolved successfully.' : 'Clinical report saved.' });
            onSuccess();
        } catch (e) {
            Toast.show({ type: 'error', text1: 'Error', text2: e.response?.data?.error || 'Failed to submit clinical report.' });
        } finally { setSubmitting(false); }
    };

    return (
        <ScrollView contentContainerStyle={styles.formContainer}>
            <Pressable onPress={onCancel} style={styles.backLink}>
                <Feather name="chevron-left" size={18} color={CLR.primary} />
                <Text style={styles.backLinkTxt}>Back to {backTo === 'cases' ? 'My Cases' : 'Review Queue'}</Text>
            </Pressable>

            <View style={styles.formCard}>
                <Text style={styles.formH1}>{isPrimaryCare ? 'Clinical Diagnosis & Treatment' : 'Specialist Consultation Report'}</Text>
                <Text style={styles.formLabel}>CASE: {selectedCase.caseId} — {selectedCase.patient?.name}</Text>

                <View style={styles.complaintBox}>
                    <Text style={styles.boxLabel}>CHIEF COMPLAINT</Text>
                    <Text style={styles.boxText}>{selectedCase.chiefComplaint}</Text>
                    {selectedCase.symptoms?.length > 0 && (
                        <Text style={[styles.boxText, { marginTop: 6, color: CLR.textSec }]}>
                            Symptoms: {selectedCase.symptoms.join(', ')}
                        </Text>
                    )}
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Final Diagnosis *</Text>
                    <TextInput style={styles.inputField} value={form.finalDiagnosis} onChangeText={set('finalDiagnosis')} placeholder="Major clinical finding..." />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Treatment Plan</Text>
                    <TextInput
                        style={[styles.inputField, { height: 100, textAlignVertical: 'top', paddingTop: 12 }]}
                        value={form.treatmentPlan} onChangeText={set('treatmentPlan')}
                        placeholder="Detailed clinical instructions..." multiline
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Dietary Advice</Text>
                    <TextInput style={styles.inputField} value={form.dietaryAdvice} onChangeText={set('dietaryAdvice')} placeholder="Diet and lifestyle recommendations..." />
                </View>

                {/* Prescription (Rx) */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <Text style={styles.inputLabel}>Prescription (Rx)</Text>
                    <Btn
                        style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: CLR.primarySoft, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }}
                        onPress={addRxItem}
                    >
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
                            style={[styles.inputField, { marginBottom: 8, height: 42 }]}
                            value={rx.medicine} onChangeText={v => setRx(idx, 'medicine', v)}
                        />
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            <TextInput placeholder="Dosage" style={[styles.inputField, { flex: 1, height: 42 }]} value={rx.dosage} onChangeText={v => setRx(idx, 'dosage', v)} />
                            <TextInput placeholder="Frequency" style={[styles.inputField, { flex: 1, height: 42 }]} value={rx.frequency} onChangeText={v => setRx(idx, 'frequency', v)} />
                            <TextInput placeholder="Duration" style={[styles.inputField, { flex: 1, height: 42 }]} value={rx.duration} onChangeText={v => setRx(idx, 'duration', v)} />
                        </View>
                    </View>
                ))}

                {/* Optional Follow-up Date */}
                {!closeCase && (
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Next Follow-up Date (Optional)</Text>
                        <TextInput style={styles.inputField} value={form.followupDate} onChangeText={set('followupDate')} placeholder="YYYY-MM-DD" />
                    </View>
                )}

                {/* Resolve toggle */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: closeCase ? CLR.successSoft : CLR.primarySoft, borderRadius: 12, padding: 16, marginBottom: 24, marginTop: 8 }}>
                    <View>
                        <Text style={{ fontSize: 15, fontWeight: '700', color: closeCase ? CLR.success : CLR.primary }}>
                            {closeCase ? '✓ Resolve Case' : (isPrimaryCare ? 'Start Active Treatment' : 'Keep Under Specialist Review')}
                        </Text>
                        <Text style={{ fontSize: 13, color: CLR.textSec, marginTop: 2 }}>
                            {closeCase ? 'Case will be marked as RESOLVED' : (isPrimaryCare ? 'Case marked as DIAGNOSED' : 'Case stays in SPECIALIST_REVIEW')}
                        </Text>
                    </View>
                    <Pressable
                        onPress={() => setCloseCase(v => !v)}
                        style={{ width: 48, height: 28, borderRadius: 14, backgroundColor: closeCase ? CLR.success : '#CBD5E1', justifyContent: 'center', paddingHorizontal: 2 }}
                    >
                        <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff', alignSelf: closeCase ? 'flex-end' : 'flex-start' }} />
                    </Pressable>
                </View>

                <Pressable style={styles.submitCaseBtn} onPress={submit} disabled={submitting}>
                    {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitCaseBtnTxt}>{closeCase ? 'Finalize & Resolve Case' : 'Save Clinical Report'}</Text>}
                </Pressable>

                {currentFollowUp && (
                    <Btn
                        style={[styles.submitCaseBtn, { backgroundColor: CLR.success, marginTop: 12 }]}
                        onPress={() => setShowCompleteModal(true)}
                        disabled={submitting}
                    >
                        <Feather name="check-circle" size={18} color="#fff" style={{ marginRight: 8 }} />
                        <Text style={styles.submitCaseBtnTxt}>Mark Follow-up Complete</Text>
                    </Btn>
                )}

                {/* Multi-action Modal */}
                {showCompleteModal && (
                    <View style={styles.modalOverlay}>
                        <View style={styles.seniorModal}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Complete Follow-up</Text>
                                <Pressable onPress={() => setShowCompleteModal(false)}><Feather name="x" size={20} color={CLR.textSec} /></Pressable>
                            </View>
                            <Text style={styles.statLabel}>Follow-up for {selectedCase.patient?.name} is finished. What's the next step?</Text>

                            <View style={{ gap: 12, marginTop: 24 }}>
                                <Btn
                                    style={[styles.submitCaseBtn, { backgroundColor: CLR.success, marginTop: 0 }]}
                                    onPress={() => handleCompleteFollowup('resolve')}
                                    disabled={submitting}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Feather name="check-circle" size={16} color="#fff" style={{ marginRight: 8 }} />
                                        <Text style={styles.submitCaseBtnTxt}>Complete & Resolve Case</Text>
                                    </View>
                                </Btn>

                                <Btn
                                    style={[styles.submitCaseBtn, { backgroundColor: '#fff', borderWidth: 1, borderColor: CLR.primary, marginTop: 0 }]}
                                    onPress={() => handleCompleteFollowup('next')}
                                    disabled={submitting}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Feather name="edit" size={16} color={CLR.primary} style={{ marginRight: 8 }} />
                                        <Text style={[styles.submitCaseBtnTxt, { color: CLR.primary }]}>Complete & Stay Active</Text>
                                    </View>
                                </Btn>
                            </View>
                        </View>
                    </View>
                )}
            </View>
        </ScrollView>
    );
}

// ─── ROOT CONTAINER ───────────────────────────────────────────────────────────

export default function SeniorDoctorDashboard() {
    const { user, logout } = useAuth();
    const [nav, setNav] = useState('dashboard');
    const [cases, setCases] = useState([]);
    const [allCases, setAllCases] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedCase, setSelectedCase] = useState(null);
    const [search, setSearch] = useState('');

    const handleSelectCase = useCallback(async (caseOrId) => {
        if (!caseOrId) return;
        setLoading(true);
        try {
            let fullCase = caseOrId;
            if (typeof caseOrId === 'string') {
                const res = await caseService.get(caseOrId);
                fullCase = res.data.data;
            }
            setSelectedCase({ ...fullCase, _prevTab: nav === 'diagnose' ? 'dashboard' : nav });
            setNav('diagnose');
        } catch (e) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Could not open case details.' });
        } finally {
            setLoading(false);
        }
    }, [nav]);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [cRes, arcRes, anaRes] = await Promise.all([
                caseService.list({ limit: 50 }), // Dashboard recent
                caseService.list({ limit: 100 }), // Full queue
                analyticsService.summary().catch(() => ({ data: { data: null } }))
            ]);
            setCases(cRes.data.data || []);
            setAllCases(arcRes.data.data || []);
            setAnalytics(anaRes.data.data || null);
        } catch {
            Toast.show({ type: 'error', text1: 'Sync Fail', text2: 'Could not fetch clinic updates.' });
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const stats = useMemo(() => [
        { label: 'TOTAL CASES', value: analytics?.totalCases || 6, icon: <Feather name="clipboard" size={20} color={CLR.primary} />, bg: CLR.primarySoft },
        { label: 'ACTIVE CASES', value: analytics?.activeCases || 4, icon: <MaterialCommunityIcons name="heart-pulse" size={20} color={CLR.warning} />, bg: CLR.warningSoft },
        { label: 'CRITICAL', value: analytics?.severityBreakdown?.critical || 1, icon: <Feather name="alert-triangle" size={18} color={CLR.danger} />, bg: CLR.dangerSoft },
        { label: 'VILLAGES', value: analytics?.villageCount || 4, icon: <Feather name="home" size={20} color={CLR.success} />, bg: CLR.successSoft },
    ], [analytics]);

    // Role-specific filtering
    const myCases = allCases.filter(c => c.assignedTo?._id === user?._id);
    const reviewQueue = allCases.filter(c => c.status === 'ESCALATED' || c.status === 'SPECIALIST_REVIEW');

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
                    <SidebarItem icon="activity" label="Case Tracking" active={nav === 'tracking'} onPress={() => setNav('tracking')} />
                </View>

                <View style={styles.sidebarFooter}>
                    <View style={styles.userCard}>
                        <View style={styles.userAvatar}>
                            <Text style={styles.userInitials}>{user?.name?.[0]}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.userName}>Dr. {user?.name}</Text>
                            <Text style={styles.userRole}>Senior Doctor</Text>
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
                {/* TOPBAR */}
                <View style={styles.topbar}>
                    <View style={styles.topbarLeft}>
                        <Feather name="shield" size={18} color={CLR.primary} />
                        <Text style={[TY.bodySemi, { marginLeft: 10 }]}>Secure Clinical Environment</Text>
                    </View>
                    <View style={styles.topbarRight}>
                        <NotificationBell onSelectCase={handleSelectCase} />
                    </View>
                </View>

                {/* VIEW SWITCHER */}
                {nav === 'dashboard' ? (
                    <DashboardView
                        stats={stats} cases={cases} loading={loading} onRefresh={loadData}
                        onNav={(dest) => setNav(dest)}
                        onOpenCase={(c) => { setSelectedCase({ ...c, _prevTab: 'dashboard' }); setNav('diagnose'); }}
                        myCases={myCases}
                        reviewQueue={reviewQueue}
                    />
                ) : nav === 'cases' ? (
                    <MyCasesView cases={myCases} loading={loading} onRefresh={loadData}
                        onDiagnose={(c) => { setSelectedCase({ ...c, _prevTab: 'cases' }); setNav('diagnose'); }}
                    />
                ) : nav === 'review' ? (
                    <PatientReviewView cases={reviewQueue} loading={loading} onRefresh={loadData}
                        onReview={(c) => { setSelectedCase({ ...c, _prevTab: 'review' }); setNav('diagnose'); }}
                    />
                ) : nav === 'tracking' ? (
                    <CaseTrackingView cases={allCases} loading={loading} onRefresh={loadData}
                        onOpenCase={(c) => { setSelectedCase({ ...c, _prevTab: 'tracking' }); setNav('diagnose'); }}
                    />
                ) : nav === 'diagnose' && selectedCase ? (
                    <DiagnosisFormView
                        selectedCase={selectedCase}
                        backTo={selectedCase._prevTab || 'review'}
                        onCancel={() => setNav(selectedCase._prevTab || 'review')}
                        onSuccess={() => { setNav(selectedCase._prevTab || 'review'); loadData(); }}
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

    // Topbar
    topbar: { height: 80, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: CLR.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 32, zIndex: 100 },
    topbarLeft: { flexDirection: 'row', alignItems: 'center' },
    topbarRight: { flexDirection: 'row', alignItems: 'center' },

    // Content Common
    content: { padding: 32 },
    viewContainer: { flex: 1 },
    viewHeader: { padding: 32, paddingBottom: 16 },
    viewTitle: { fontSize: 24, fontWeight: '800', color: CLR.textPri, letterSpacing: -0.5 },
    viewSubtitle: { fontSize: 15, color: CLR.textSec, marginTop: 4 },

    // Dashboard View
    greetingSection: { marginBottom: 32 },
    welcomeText: { fontSize: 24, fontWeight: '800', color: CLR.textPri, letterSpacing: -0.5 },
    subGreeting: { fontSize: 15, color: CLR.textSec, marginTop: 4 },
    statsRow: { flexDirection: 'row', gap: 20, marginBottom: 32 },
    statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', ...SHADOW.sm },
    statLabel: { color: CLR.textSec, fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
    statValue: { color: CLR.textPri, fontSize: 28, fontWeight: '700', marginTop: 8 },
    statIconCircle: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    panel: { backgroundColor: '#fff', borderRadius: 20, padding: 24, ...SHADOW.md },
    panelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
    panelTitle: { fontSize: 18, fontWeight: '700', color: CLR.textPri },
    viewAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    viewAllTxt: { fontSize: 14, fontWeight: '600', color: CLR.textSec },
    caseList: { gap: 12 },
    caseRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', gap: 16 },
    patientAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E0F2FE', alignItems: 'center', justifyContent: 'center' },
    avatarTxt: { color: '#0369A1', fontSize: 15, fontWeight: '700' },
    casePatientName: { fontSize: 15, fontWeight: '600', color: CLR.textPri },
    caseComplaint: { fontSize: 13, color: CLR.textSec, marginTop: 2 },
    caseActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
    badgePill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    badgeTxt: { fontSize: 12, fontWeight: '600' },

    // Review View
    searchBarStrip: { marginHorizontal: 32, backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 18, height: 50, flexDirection: 'row', alignItems: 'center', gap: 12, ...SHADOW.sm, borderWidth: 1, borderColor: CLR.border },
    stripedSearch: { flex: 1, fontSize: 15, color: CLR.textPri },
    workstationCard: { backgroundColor: '#fff', borderRadius: 16, padding: 24, marginBottom: 16, ...SHADOW.sm, borderWidth: 1, borderColor: CLR.border },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    cardPatientName: { fontSize: 17, fontWeight: '700', color: CLR.textPri },
    cardCaseId: { fontSize: 13, color: CLR.primary, fontWeight: '600', marginTop: 2 },
    cardComplaint: { fontSize: 15, color: CLR.textSec, lineHeight: 22, marginBottom: 20 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: CLR.border, paddingTop: 16 },
    footerMeta: { fontSize: 13, color: CLR.textSec, fontWeight: '500' },
    actionBtnSmall: { backgroundColor: CLR.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
    actionBtnTxtSmall: { color: '#fff', fontSize: 13, fontWeight: '600' },

    // Tracking View
    tableHead: { flexDirection: 'row', paddingHorizontal: 32, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: CLR.border, backgroundColor: '#F8FAFC' },
    th: { fontSize: 11, fontWeight: '700', color: CLR.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 },
    tableRow: { flexDirection: 'row', paddingHorizontal: 32, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', alignItems: 'center', backgroundColor: '#fff' },
    td: { fontSize: 14, color: CLR.textPri },

    // Diagnosis Form
    formContainer: { padding: 40, alignItems: 'center' },
    backLink: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', marginBottom: 24 },
    backLinkTxt: { fontSize: 15, fontWeight: '600', color: CLR.primary, marginLeft: 4 },
    formCard: { backgroundColor: '#fff', width: '100%', maxWidth: 700, borderRadius: 24, padding: 40, ...SHADOW.md },
    formH1: { fontSize: 24, fontWeight: '700', color: CLR.textPri, marginBottom: 8 },
    formLabel: { fontSize: 13, fontWeight: '600', color: CLR.primary, marginBottom: 32 },
    complaintBox: { backgroundColor: '#F8FAFC', padding: 20, borderRadius: 16, marginBottom: 32, borderLeftWidth: 4, borderLeftColor: CLR.primary },
    boxLabel: { fontSize: 11, fontWeight: '800', color: CLR.primary, letterSpacing: 1 },
    boxText: { fontSize: 15, color: '#334155', marginTop: 10, lineHeight: 22 },
    inputGroup: { marginBottom: 24 },
    inputLabel: { fontSize: 14, fontWeight: '600', color: '#1E293B', marginBottom: 10 },
    inputField: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: CLR.border, borderRadius: 12, height: 50, paddingHorizontal: 16, fontSize: 15, color: CLR.textPri },
    submitCaseBtn: { backgroundColor: CLR.primary, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 16, ...SHADOW.md },
    submitCaseBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },

    // Quick action cards
    quickActions: { flexDirection: 'row', gap: 16, marginBottom: 32 },
    qaCard: {
        flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 20,
        flexDirection: 'row', alignItems: 'center', gap: 16,
        borderLeftWidth: 4, ...SHADOW.sm,
    },
    qaTitle: { fontSize: 16, fontWeight: '700', color: CLR.textPri },
    qaSub: { fontSize: 13, color: CLR.textSec, marginTop: 4 },

    // Filter pills (tracking view)
    filterPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: CLR.border },
    filterPillActive: { backgroundColor: CLR.primary, borderColor: CLR.primary },
    filterPillTxt: { fontSize: 13, fontWeight: '600', color: CLR.textSec },
    filterPillTxtActive: { color: '#fff' },

    emptyTxt: { textAlign: 'center', color: CLR.textSec, padding: 40, fontWeight: '500' },
    modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    seniorModal: { width: 440, backgroundColor: '#fff', borderRadius: 24, padding: 32, ...SHADOW.lg }
});

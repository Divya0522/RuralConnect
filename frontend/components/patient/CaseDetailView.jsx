import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    ActivityIndicator, Linking, Platform
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { CLR, TY, SP, SHADOW } from '../../constants/DesignTokens';
import { diagnosisService, caseService, followUpService } from '../../services/api';
import CaseTimeline from './CaseTimeline';
import GlassCard from '../ui/GlassCard';
import Toast from 'react-native-toast-message';

// ─── Status Guidance Map ───────────────────────────────────────────────────────
const STATUS_GUIDANCE = {
    NEW: {
        meaning: 'Your complaint has been received and is in the queue.',
        nextStep: 'Waiting for a doctor to be assigned. This usually takes a few hours.',
        icon: 'clock',
        color: CLR.textMuted,
    },
    ASSIGNED: {
        meaning: 'A doctor has been assigned and is reviewing your case.',
        nextStep: 'Please be available for a call. The doctor will contact you soon.',
        icon: 'user-check',
        color: CLR.status.ASSIGNED.txt,
    },
    DIAGNOSED: {
        meaning: 'Your doctor has reviewed your symptoms and prepared a diagnosis.',
        nextStep: 'Follow the prescribed treatment plan. Download your prescription below.',
        icon: 'check-circle',
        color: CLR.success,
    },
    FOLLOWUP: {
        meaning: 'A follow-up has been scheduled to check on your progress.',
        nextStep: 'Attend your scheduled follow-up consultation as advised.',
        icon: 'calendar',
        color: CLR.status.FOLLOWUP.txt,
    },
    ESCALATED: {
        meaning: 'Your case has been escalated due to severity or complexity.',
        nextStep: 'A senior specialist has been alerted. Please monitor closely.',
        icon: 'alert-triangle',
        color: CLR.danger,
    },
    SPECIALIST_REVIEW: {
        meaning: 'A specialist is actively reviewing your case.',
        nextStep: 'The specialist may request additional information or tests.',
        icon: 'activity',
        color: CLR.status.SPECIALIST_REVIEW.txt,
    },
    RESOLVED: {
        meaning: 'Your case has been successfully resolved by the medical team.',
        nextStep: 'If symptoms return, please submit a new complaint.',
        icon: 'check-circle',
        color: CLR.success,
    },
    CLOSED: {
        meaning: 'This case is now closed in our system.',
        nextStep: 'Submit a new complaint if you experience further issues.',
        icon: 'archive',
        color: CLR.textMuted,
    },
};

// ─── Avatar Circle ─────────────────────────────────────────────────────────────
function AvatarCircle({ name = '?', size = 40 }) {
    return (
        <View style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: CLR.primary + '10',
            alignItems: 'center',
            justifyContent: 'center',
        }}>
            <Text style={{
                fontSize: size * 0.4,
                fontWeight: '700',
                color: CLR.primary
            }}>
                {name?.charAt(0).toUpperCase()}
            </Text>
        </View>
    );
}

// ─── Status Guidance Panel ─────────────────────────────────────────────────────
const StatusGuidancePanel = ({ status }) => {
    const g = STATUS_GUIDANCE[status] || STATUS_GUIDANCE.NEW;
    return (
        <GlassCard style={styles.guidanceCard}>
            <View style={styles.guidanceHeader}>
                <View style={[styles.guidanceIconBox, { backgroundColor: g.color + '18' }]}>
                    <Feather name={g.icon} size={18} color={g.color} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[TY.bodySemi, { color: CLR.textPri }]}>
                        Status: {status?.replace(/_/g, ' ')}
                    </Text>
                    <Text style={[TY.small, { color: CLR.textSec, marginTop: 2 }]}>
                        {g.meaning}
                    </Text>
                </View>
            </View>
            <View style={styles.nextStepRow}>
                <Feather name="arrow-right-circle" size={14} color={CLR.primary} />
                <Text style={[TY.small, { marginLeft: 8, color: CLR.primary, fontWeight: '600', flex: 1 }]}>
                    {g.nextStep}
                </Text>
            </View>
        </GlassCard>
    );
};

// ─── Main Component ────────────────────────────────────────────────────────────
const CaseDetailView = ({ caseData, onClose }) => {
    const [loading, setLoading] = useState(true);
    const [diagnosis, setDiagnosis] = useState(null);
    const [caseDetails, setCaseDetails] = useState(caseData);
    const [pendingFollowUp, setPendingFollowUp] = useState(null);

    useEffect(() => {
        if (!caseData?._id) return;
        const fetchData = async () => {
            setLoading(true);
            try {
                const [diagRes, caseRes, followUpRes] = await Promise.all([
                    diagnosisService.list({ caseId: caseData._id }).catch(() => ({ data: { data: [] } })),
                    caseService.get(caseData._id).catch(() => ({ data: { data: caseData } })),
                    followUpService.list({ caseId: caseData._id, isCompleted: false, limit: 1 }).catch(() => ({ data: { data: [] } }))
                ]);
                setDiagnosis(diagRes.data.data?.[0] || null);
                setCaseDetails(caseRes.data.data || caseData);
                setPendingFollowUp(followUpRes.data.data?.[0] || null);
            } catch (e) {
                console.error('Failed to fetch case details', e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [caseData?._id]);

    if (!caseData) return null;

    const severityColor = CLR.status[caseDetails.severity?.toUpperCase()]?.txt || CLR.warning;
    const isFollowup = caseDetails.status === 'FOLLOWUP';

    const handleDownloadPrescription = () => {
        if (diagnosis?.prescriptionUrl) {
            Linking.openURL(diagnosis.prescriptionUrl).catch(() => {
                Toast.show({ type: 'error', text1: 'Could not open prescription', text2: 'Try again later.' });
            });
        } else {
            Toast.show({
                type: 'info',
                text1: 'PDF Not Ready',
                text2: 'Your prescription PDF will be available once finalized.'
            });
        }
    };

    return (
        <View style={styles.container}>
            {/* ── Header ───────────────────────────────────────────────────── */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={onClose}
                    style={styles.backBtn}
                    accessibilityRole="button"
                    accessibilityLabel="Go back to dashboard"
                >
                    <Feather name="arrow-left" size={20} color={CLR.textPri} />
                    <Text style={[TY.bodySemi, { marginLeft: 8 }]}>Back to Dashboard</Text>
                </TouchableOpacity>
                <View style={styles.headerRight}>
                    <Text style={styles.caseId}>CASE #{caseDetails.caseId || 'Pending'}</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* ── Case Progress Timeline ───────────────────────────────── */}
                <CaseTimeline currentStatus={caseDetails.status} />

                {/* ── Status Guidance Panel ────────────────────────────────── */}
                <StatusGuidancePanel status={caseDetails.status} />

                {/* ── Patient Info + Complaint ─────────────────────────────── */}
                <View style={styles.row}>
                    <GlassCard style={[styles.card, { flex: 1 }]}>
                        <Text style={[TY.h3, { marginBottom: SP.base }]}>Patient Info</Text>
                        <View style={styles.infoRow}>
                            <AvatarCircle name={caseDetails.patient?.name} size={48} />
                            <View style={{ marginLeft: 12 }}>
                                <Text style={TY.h3}>{caseDetails.patient?.name}</Text>
                                <Text style={TY.bodyMuted}>
                                    {caseDetails.patient?.gender?.toUpperCase()} • {caseDetails.patient?.age} Years
                                </Text>
                            </View>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.metaInfo}>
                            <Feather name="map-pin" size={14} color={CLR.textMuted} />
                            <Text style={[TY.bodyMuted, { marginLeft: 8 }]}>
                                {caseDetails.village?.name || 'Unknown'}
                            </Text>
                        </View>
                    </GlassCard>

                    <GlassCard style={[styles.card, { flex: 1.5 }]}>
                        <View style={styles.sectionHeader}>
                            <Text style={TY.h3}>Chief Complaint</Text>
                            <View style={[styles.sevMeter, { backgroundColor: severityColor + '20' }]}>
                                <Text style={[styles.sevText, { color: severityColor }]}>
                                    {caseDetails.severity?.toUpperCase()}
                                </Text>
                            </View>
                        </View>
                        <Text style={[TY.body, { marginTop: SP.sm, lineHeight: 22 }]}>
                            {caseDetails.chiefComplaint}
                        </Text>

                        <Text style={[TY.bodySemi, { marginTop: SP.base }]}>Symptoms</Text>
                        <View style={styles.tagList}>
                            {(caseDetails.symptoms?.length > 0)
                                ? caseDetails.symptoms.map((s, i) => (
                                    <View key={i} style={styles.tag}>
                                        <Text style={styles.tagText}>{s}</Text>
                                    </View>
                                ))
                                : <Text style={TY.bodyMuted}>No symptoms recorded</Text>
                            }
                        </View>
                    </GlassCard>
                </View>

                {/* ── Medical Progress ─────────────────────────────────────── */}
                {loading ? (
                    <View style={styles.loadingBox}>
                        <ActivityIndicator color={CLR.primary} />
                        <Text style={[TY.bodyMuted, { marginTop: 12 }]}>
                            Loading medical details...
                        </Text>
                    </View>
                ) : diagnosis ? (
                    <View style={styles.row}>
                        {/* Diagnosis & Plan */}
                        <GlassCard style={[styles.card, { flex: 1.5 }]}>
                            <View style={styles.sectionHeader}>
                                <Text style={TY.h3}>Diagnosis & Plan</Text>
                                <TouchableOpacity
                                    style={styles.downloadBtn}
                                    onPress={handleDownloadPrescription}
                                    accessibilityRole="button"
                                    accessibilityLabel="Download prescription PDF"
                                >
                                    <Feather name="download" size={16} color={CLR.primary} />
                                    <Text style={styles.downloadText}>Prescription PDF</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.diagBox}>
                                <Text style={TY.bodySemi}>Doctor's Conclusion</Text>
                                <Text style={[TY.body, { marginTop: 4 }]}>
                                    {diagnosis.finalDiagnosis}
                                </Text>
                                {diagnosis.icdCode && (
                                    <Text style={TY.small}>ICD-10: {diagnosis.icdCode}</Text>
                                )}
                            </View>

                            <Text style={[TY.bodySemi, { marginTop: SP.base }]}>Prescription</Text>
                            {diagnosis.prescription?.map((m, i) => (
                                <View key={i} style={styles.prescItem}>
                                    <View style={styles.prescIcon}>
                                        <Feather name="plus-square" size={16} color={CLR.primary} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={TY.bodySemi}>{m.medicine}</Text>
                                        <Text style={TY.bodyMuted}>
                                            {m.dosage} • {m.frequency} • {m.duration}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </GlassCard>

                        {/* Care Team */}
                        <GlassCard style={[styles.card, { flex: 1 }]}>
                            <Text style={TY.h3}>Care Team</Text>
                            <View style={styles.doctorItem}>
                                <AvatarCircle name={diagnosis.doctor?.name} size={40} />
                                <View style={{ marginLeft: 12 }}>
                                    <Text style={TY.bodySemi}>{diagnosis.doctor?.name}</Text>
                                    <Text style={TY.small}>
                                        {diagnosis.doctor?.qualification || 'Senior Doctor'}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.divider} />

                            <Text style={TY.bodySemi}>Next Step</Text>
                            <View style={styles.followupBox}>
                                <Feather name="calendar" size={16} color={CLR.warning} />
                                <Text style={[TY.body, { marginLeft: 8, flex: 1 }]}>
                                    {diagnosis.treatmentPlan?.includes('Follow-up')
                                        ? 'Follow-up Scheduled'
                                        : 'Monitor Progression'}
                                </Text>
                            </View>

                            {/* Follow-up Reminder Banner */}
                            {(isFollowup || pendingFollowUp) && (
                                <View style={styles.followupReminder}>
                                    <Feather name="bell" size={14} color={CLR.status.FOLLOWUP.txt} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.followupReminderText]}>
                                            Upcoming Follow-up Appointment
                                        </Text>
                                        <Text style={TY.small}>
                                            {pendingFollowUp?.scheduledDate
                                                ? new Date(pendingFollowUp.scheduledDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
                                                : 'Awaiting date confirmation'}
                                        </Text>
                                    </View>
                                </View>
                            )}
                        </GlassCard>
                    </View>
                ) : (
                    /* Pending Diagnosis Empty State */
                    <View style={styles.emptyState}>
                        <Feather name="clock" size={40} color={CLR.textMuted} />
                        <Text style={[TY.h3, { marginTop: 16 }]}>Pending Diagnosis</Text>
                        <Text style={[TY.bodyMuted, { textAlign: 'center', marginTop: 8, lineHeight: 22 }]}>
                            Our doctors are reviewing your case. You will be notified once the diagnosis is ready.
                        </Text>
                        <View style={styles.pendingTip}>
                            <Feather name="info" size={14} color={CLR.primary} />
                            <Text style={[TY.small, { marginLeft: 8, color: CLR.primary }]}>
                                Most cases are reviewed within 24 hours.
                            </Text>
                        </View>
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: CLR.bg,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SP.xl,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: CLR.border,
    },
    backBtn: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerRight: {},
    caseId: {
        color: CLR.textMuted,
        fontWeight: '700',
        fontSize: 12,
        letterSpacing: 1,
    },
    scrollContent: {
        padding: SP.xl,
        gap: SP.xl,
    },
    // Guidance panel
    guidanceCard: {
        padding: 16,
    },
    guidanceHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    guidanceIconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    nextStepRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: CLR.primary + '0D',
        borderRadius: 10,
        padding: 10,
    },
    // Layout
    row: {
        flexDirection: 'row',
        gap: SP.xl,
    },
    card: {
        padding: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SP.base,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    divider: {
        height: 1,
        backgroundColor: CLR.borderLight,
        marginVertical: SP.base,
    },
    metaInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    sevMeter: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    sevText: {
        fontWeight: '800',
        fontSize: 11,
    },
    tagList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 10,
    },
    tag: {
        backgroundColor: CLR.bg,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: CLR.borderLight,
    },
    tagText: {
        fontSize: 12,
        color: CLR.textSec,
        fontWeight: '500',
    },
    // Loading
    loadingBox: {
        padding: 60,
        alignItems: 'center',
        justifyContent: 'center',
    },
    // Diagnosis
    diagBox: {
        backgroundColor: CLR.bg,
        padding: 16,
        borderRadius: 12,
        marginBottom: SP.base,
    },
    prescItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        padding: 12,
        backgroundColor: '#fff',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: CLR.borderLight,
    },
    prescIcon: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: CLR.primary + '10',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    downloadBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        borderRadius: 8,
        backgroundColor: CLR.primary + '10',
    },
    downloadText: {
        color: CLR.primary,
        fontWeight: '700',
        fontSize: 12,
        marginLeft: 6,
    },
    doctorItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: SP.base,
    },
    followupBox: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        backgroundColor: CLR.status.FOLLOWUP.bg,
        padding: 12,
        borderRadius: 10,
    },
    // Follow-up reminder
    followupReminder: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        backgroundColor: CLR.status.FOLLOWUP.bg,
        borderRadius: 10,
        padding: 10,
        gap: 8,
        borderLeftWidth: 2,
        borderLeftColor: CLR.status.FOLLOWUP.dot,
    },
    followupReminderText: {
        fontSize: 12,
        fontWeight: '600',
        color: CLR.status.FOLLOWUP.txt,
        flex: 1,
    },
    // Empty state
    emptyState: {
        padding: 60,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pendingTip: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
        backgroundColor: CLR.primary + '10',
        padding: 12,
        borderRadius: 10,
    },
});

export default CaseDetailView;

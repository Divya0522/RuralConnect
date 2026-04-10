import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { CLR, TY, SP, SHADOW } from '../../constants/DesignTokens';
import GlassCard from '../ui/GlassCard';

// ─── Status explanation map ────────────────────────────────────────────────────
const STATUS_MEANINGS = {
    NEW: 'Your complaint has been received and is waiting for a doctor to review.',
    ASSIGNED: 'A doctor has been assigned and is reviewing your case.',
    DIAGNOSED: 'Your doctor has made a diagnosis and created a treatment plan.',
    FOLLOWUP: 'A follow-up consultation has been scheduled for you.',
    ESCALATED: 'Your case has been escalated for urgent specialist attention.',
    SPECIALIST_REVIEW: 'A specialist doctor is actively reviewing your case.',
    RESOLVED: 'Your case has been successfully resolved.',
    CLOSED: 'Your case has been closed. Contact us if symptoms return.',
};

// ─── Status Tooltip Modal ──────────────────────────────────────────────────────
const StatusTooltip = ({ visible, onClose }) => (
    <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
    >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
            <View style={[styles.tooltipCard, SHADOW.lg]}>
                <View style={styles.tooltipHeader}>
                    <Text style={TY.h3}>Case Status Guide</Text>
                    <TouchableOpacity onPress={onClose} accessibilityLabel="Close guide">
                        <Feather name="x" size={20} color={CLR.textMuted} />
                    </TouchableOpacity>
                </View>
                <ScrollView showsVerticalScrollIndicator={false}>
                    {Object.entries(STATUS_MEANINGS).map(([key, desc]) => (
                        <View key={key} style={styles.tooltipRow}>
                            <View style={[styles.tooltipDot, { backgroundColor: CLR.status[key]?.dot || CLR.textMuted }]} />
                            <View style={{ flex: 1 }}>
                                <Text style={[TY.bodySemi, { color: CLR.status[key]?.txt || CLR.textPri }]}>
                                    {key.replace(/_/g, ' ')}
                                </Text>
                                <Text style={[TY.small, { color: CLR.textSec, marginTop: 2 }]}>{desc}</Text>
                            </View>
                        </View>
                    ))}
                </ScrollView>
            </View>
        </TouchableOpacity>
    </Modal>
);

// ─── Health Summary Card ───────────────────────────────────────────────────────
export const HealthSummary = ({
    activeCases,
    upcomingFollowup,
    assignedDoctor,
    lastDiagnosis,
    onEmergency,
    hasFollowup,
    criticalCase,
}) => {
    const [showTooltip, setShowTooltip] = useState(false);

    return (
        <>
            <StatusTooltip visible={showTooltip} onClose={() => setShowTooltip(false)} />
            <GlassCard style={styles.summaryCard}>

                {/* ── Urgency Alert (critical / escalated) ─────────────────── */}
                {criticalCase && (
                    <View style={styles.urgencyAlert}>
                        <Feather name="alert-triangle" size={16} color={CLR.danger} />
                        <View style={{ flex: 1, marginLeft: 10 }}>
                            <Text style={[TY.bodySemi, { color: CLR.danger }]}>Urgent Case Requires Attention</Text>
                            <Text style={[TY.small, { color: CLR.danger + 'CC' }]} numberOfLines={1}>
                                {criticalCase.chiefComplaint}
                            </Text>
                        </View>
                    </View>
                )}

                {/* ── Follow-up Alert Banner ────────────────────────────────── */}
                {hasFollowup && (
                    <View style={styles.followupAlert}>
                        <Feather name="calendar" size={15} color={CLR.status.FOLLOWUP.txt} />
                        <Text style={[styles.followupAlertText]}>
                            You have a follow-up consultation scheduled
                        </Text>
                    </View>
                )}

                {/* ── Header ───────────────────────────────────────────────── */}
                <View style={styles.header}>
                    <View style={styles.titleRow}>
                        <Text style={[TY.h2, { color: CLR.primary }]}>Health Summary</Text>
                        <TouchableOpacity
                            style={styles.infoBtn}
                            onPress={() => setShowTooltip(true)}
                            accessibilityLabel="View status guide"
                            accessibilityHint="Opens a guide explaining what each case status means"
                        >
                            <Feather name="help-circle" size={16} color={CLR.textMuted} />
                        </TouchableOpacity>
                        <View style={styles.activeBadge}>
                            <Text style={styles.activeText}>{activeCases} Active</Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={styles.emergencyBtn}
                        onPress={onEmergency}
                        accessibilityRole="button"
                        accessibilityLabel="Trigger emergency alert"
                    >
                        <Text style={styles.emergencyText}>EMERGENCY</Text>
                    </TouchableOpacity>
                </View>

                {/* ── Stats Grid ───────────────────────────────────────────── */}
                <View style={styles.grid}>
                    <View style={styles.statItem}>
                        <Feather name="calendar" size={18} color={CLR.primary} />
                        <View style={styles.statInfo}>
                            <Text style={TY.caption}>Upcoming Follow-up</Text>
                            <Text style={TY.bodySemi}>{upcomingFollowup || 'None Scheduled'}</Text>
                        </View>
                    </View>

                    <View style={styles.statItem}>
                        <Feather name="user" size={18} color={assignedDoctor ? CLR.success : CLR.textMuted} />
                        <View style={styles.statInfo}>
                            <Text style={TY.caption}>Assigned Doctor</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                {/* Dot indicator */}
                                <View style={[
                                    styles.assignedDot,
                                    { backgroundColor: assignedDoctor ? CLR.success : CLR.textMuted }
                                ]} />
                                <Text style={TY.bodySemi}>{assignedDoctor || 'Unassigned'}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.lastDiag}>
                    <Text style={TY.caption}>Last Diagnosis</Text>
                    <Text style={[TY.body, { marginTop: 4 }]} numberOfLines={2}>
                        {lastDiagnosis || 'No previous history available'}
                    </Text>
                </View>
            </GlassCard>
        </>
    );
};

// ─── Village Impact Card ───────────────────────────────────────────────────────
export const VillageImpact = ({ totalCases, commonDiseases, criticalCount }) => {
    return (
        <GlassCard style={styles.impactCard} intensity={0.6}>
            <View style={styles.impactHeader}>
                <Ionicons name="stats-chart" size={20} color={CLR.primary} />
                <Text style={[TY.h3, { marginLeft: 8 }]}>Village Health Trends</Text>
            </View>

            <View style={styles.impactContent}>
                <View style={styles.metric}>
                    <Text style={styles.metricVal}>{totalCases}</Text>
                    <Text style={TY.small}>Total Cases</Text>
                </View>
                <View style={styles.metric}>
                    <Text style={[styles.metricVal, { color: CLR.danger }]}>{criticalCount}</Text>
                    <Text style={TY.small}>Critical</Text>
                </View>
                <View style={styles.diseaseMetric}>
                    <Text style={TY.small}>Common in Village</Text>
                    <Text style={[TY.bodySemi, { color: CLR.primary }]} numberOfLines={1}>
                        {commonDiseases?.join(', ') || 'N/A'}
                    </Text>
                </View>
            </View>
        </GlassCard>
    );
};

const styles = StyleSheet.create({
    summaryCard: {
        marginBottom: SP.lg,
    },
    // Urgency alert
    urgencyAlert: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: CLR.danger + '12',
        borderRadius: 10,
        padding: 12,
        marginBottom: SP.base,
        borderLeftWidth: 3,
        borderLeftColor: CLR.danger,
    },
    // Follow-up banner
    followupAlert: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: CLR.status.FOLLOWUP.bg,
        borderRadius: 10,
        padding: 10,
        marginBottom: SP.base,
        gap: 8,
    },
    followupAlertText: {
        fontSize: 13,
        fontWeight: '600',
        color: CLR.status.FOLLOWUP.txt,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: SP.lg,
    },
    titleRow: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
    },
    infoBtn: {
        padding: 2,
    },
    activeBadge: {
        backgroundColor: CLR.status.ASSIGNED.bg,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    activeText: {
        color: CLR.status.ASSIGNED.txt,
        fontSize: 11,
        fontWeight: '700',
    },
    emergencyBtn: {
        backgroundColor: CLR.danger,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        ...SHADOW.md,
    },
    emergencyText: {
        color: '#fff',
        fontWeight: '800',
        fontSize: 12,
    },
    grid: {
        flexDirection: 'row',
        gap: SP.xl,
        marginBottom: SP.base,
    },
    statItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    statInfo: {
        marginLeft: 10,
    },
    assignedDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    divider: {
        height: 1,
        backgroundColor: CLR.borderLight,
        marginVertical: SP.base,
    },
    lastDiag: {
        backgroundColor: CLR.bg,
        padding: 12,
        borderRadius: 12,
    },
    // Village Impact
    impactCard: {
        marginBottom: SP.lg,
    },
    impactHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SP.base,
    },
    impactContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    metric: {
        alignItems: 'center',
    },
    metricVal: {
        fontSize: 20,
        fontWeight: '800',
        color: CLR.textPri,
    },
    diseaseMetric: {
        flex: 1,
        marginLeft: 20,
        borderLeftWidth: 1,
        borderLeftColor: CLR.border,
        paddingLeft: 16,
    },
    // Tooltip Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: SP.xl,
    },
    tooltipCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        width: '100%',
        maxWidth: 460,
        maxHeight: '80%',
    },
    tooltipHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SP.base,
    },
    tooltipRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: CLR.borderLight,
    },
    tooltipDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginTop: 4,
    },
});

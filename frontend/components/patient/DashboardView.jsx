import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, RefreshControl,
    Platform, TouchableOpacity as RNTouchableOpacity, Modal
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { CLR, TY, SP, SHADOW } from '../../constants/DesignTokens';
import GlassCard from '../ui/GlassCard';

// ─── Hover-aware Pressable ─────────────────────────────────────────────────────
const Pressable = ({ children, style, onPress, ...rest }) => {
    const [hovered, setHovered] = useState(false);
    return (
        <RNTouchableOpacity
            onPress={onPress}
            style={[style, hovered && styles.hovered]}
            activeOpacity={0.85}
            {...(Platform.OS === 'web'
                ? { onMouseEnter: () => setHovered(true), onMouseLeave: () => setHovered(false) }
                : {})}
            {...rest}
        >
            {children}
        </RNTouchableOpacity>
    );
};

// ─── Status badge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
    const s = CLR.status[status] || { bg: CLR.borderLight, txt: CLR.textMuted, dot: CLR.textMuted };
    return (
        <View style={[styles.badge, { backgroundColor: s.bg }]}>
            <View style={[styles.badgeDot, { backgroundColor: s.dot }]} />
            <Text style={[styles.badgeText, { color: s.txt }]}>
                {status?.replace(/_/g, ' ')}
            </Text>
        </View>
    );
};

// ─── Severity badge ────────────────────────────────────────────────────────────
const SEVERITY_COLORS = {
    low: { bg: '#ECFDF5', txt: '#065F46' },
    medium: { bg: '#FFFBEB', txt: '#92400E' },
    high: { bg: '#FFF7ED', txt: '#9A3412' },
    critical: { bg: '#FEF2F2', txt: '#991B1B' },
};
const SeverityBadge = ({ severity }) => {
    const s = SEVERITY_COLORS[severity] || { bg: CLR.borderLight, txt: CLR.textMuted };
    return (
        <View style={[styles.badge, { backgroundColor: s.bg }]}>
            <Text style={[styles.badgeText, { color: s.txt, textTransform: 'capitalize' }]}>
                {severity}
            </Text>
        </View>
    );
};

// ─── Info Row  ─────────────────────────────────────────────────────────────────
const InfoRow = ({ icon, label, value, valueColor }) => (
    <View style={styles.infoRow}>
        <Feather name={icon} size={14} color={CLR.textMuted} />
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={[styles.infoValue, valueColor && { color: valueColor }]} numberOfLines={1}>
            {value}
        </Text>
    </View>
);

// ─── Section Header ────────────────────────────────────────────────────────────
const SectionLabel = ({ text }) => (
    <Text style={styles.sectionLabel}>{text}</Text>
);

// ─── Status Guide Modal ────────────────────────────────────────────────────────
const STATUS_MEANINGS = {
    NEW: 'Complaint received, waiting for a doctor to review.',
    ASSIGNED: 'A doctor is assigned and reviewing your case.',
    DIAGNOSED: 'Your doctor has completed a diagnosis.',
    FOLLOWUP: 'A follow-up consultation has been scheduled.',
    ESCALATED: 'Escalated for urgent specialist attention.',
    SPECIALIST_REVIEW: 'A specialist is actively reviewing your case.',
    RESOLVED: 'Your case has been resolved.',
    CLOSED: 'Case is closed. Contact us if symptoms return.',
};

const StatusGuide = ({ visible, onClose }) => (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <RNTouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
            <View style={[styles.guideCard, SHADOW.lg]}>
                <View style={styles.guideHeader}>
                    <Text style={TY.h3}>Status Guide</Text>
                    <RNTouchableOpacity onPress={onClose}>
                        <Feather name="x" size={20} color={CLR.textMuted} />
                    </RNTouchableOpacity>
                </View>
                <ScrollView showsVerticalScrollIndicator={false}>
                    {Object.entries(STATUS_MEANINGS).map(([key, desc]) => (
                        <View key={key} style={styles.guideRow}>
                            <View style={[styles.guideDot, { backgroundColor: CLR.status[key]?.dot || CLR.textMuted }]} />
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.guideKey, { color: CLR.status[key]?.txt || CLR.textPri }]}>
                                    {key.replace(/_/g, ' ')}
                                </Text>
                                <Text style={styles.guideDesc}>{desc}</Text>
                            </View>
                        </View>
                    ))}
                </ScrollView>
            </View>
        </RNTouchableOpacity>
    </Modal>
);

// ─── Main Component ────────────────────────────────────────────────────────────
const DashboardView = ({
    user,
    cases,
    followUps = [],
    loading,
    refreshing,
    onRefresh,
    onNav,
    onSelectCase,
}) => {
    const [guideVisible, setGuideVisible] = useState(false);

    const activeCases = cases.filter(c => !['RESOLVED', 'CLOSED'].includes(c.status));
    const primaryCase = activeCases[0] || null;

    const criticalCase = activeCases.find(c =>
        c.severity === 'critical' || c.status === 'ESCALATED'
    );

    // Urgency helper for follow-ups
    const getUrgency = (date) => {
        const d = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        d.setHours(0, 0, 0, 0);

        const diff = Math.ceil((d - today) / (1000 * 60 * 60 * 24));
        if (diff <= 0) return { label: 'Today', color: CLR.danger, bg: CLR.danger + '10' };
        if (diff === 1) return { label: 'Tomorrow', color: '#F59E0B', bg: '#FFFBEB' };
        return { label: `In ${diff} days`, color: CLR.primary, bg: CLR.primaryTint };
    };

    const assignedDoctor = activeCases.find(c => c.assignedTo?.name)?.assignedTo?.name || null;

    const followupCase = followUps[0] || null;
    const hasAlerts = !!(criticalCase || followupCase);

    // Next-step instruction per status
    const nextStep = (status) => {
        const map = {
            NEW: 'Awaiting doctor assignment',
            ASSIGNED: 'Doctor is reviewing — no action needed',
            DIAGNOSED: 'Follow the treatment plan provided',
            FOLLOWUP: 'Attend your scheduled follow-up',
            ESCALATED: 'Monitor urgently — specialist has been notified',
            SPECIALIST_REVIEW: 'Specialist review in progress',
            RESOLVED: 'Case resolved',
            CLOSED: 'Case closed',
        };
        return map[status] || '—';
    };

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={[CLR.primary]}
                />
            }
        >
            <StatusGuide visible={guideVisible} onClose={() => setGuideVisible(false)} />

            {/* ── Greeting ──────────────────────────────────────────────── */}
            <View style={styles.greeting}>
                <View>
                    <Text style={styles.greetName}>
                        Good day, {user?.name?.split(' ')[0]}
                    </Text>
                    <Text style={styles.greetSub}>
                        {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </Text>
                </View>
                <Pressable style={styles.newComplaintBtn} onPress={() => onNav('complaint')}>
                    <Feather name="plus" size={15} color="#fff" />
                    <Text style={styles.newComplaintText}>New Complaint</Text>
                </Pressable>
            </View>

            {/* ── SECTION 1 · Patient Status Header ─────────────────────── */}
            <GlassCard style={styles.card}>
                <View style={styles.cardHeader}>
                    <View style={styles.cardIconWrap}>
                        <Feather name="user" size={15} color={CLR.primary} />
                    </View>
                    <Text style={styles.cardTitle}>Patient Status</Text>
                    <View style={[styles.activePill, activeCases.length > 0 && styles.activePillOn]}>
                        <Text style={[styles.activePillText, activeCases.length > 0 && styles.activePillTextOn]}>
                            {activeCases.length} Active {activeCases.length === 1 ? 'Case' : 'Cases'}
                        </Text>
                    </View>
                </View>

                <View style={styles.infoBlock}>
                    <InfoRow icon="user" label="Patient" value={user?.name || '—'} />
                    <InfoRow
                        icon="activity"
                        label="Doctor"
                        value={assignedDoctor || 'Not yet assigned'}
                        valueColor={assignedDoctor ? CLR.success : CLR.textMuted}
                    />
                    {primaryCase && (
                        <InfoRow
                            icon="layers"
                            label="Primary Case"
                            value={primaryCase.chiefComplaint}
                        />
                    )}
                </View>

                <RNTouchableOpacity style={styles.statusGuideLink} onPress={() => setGuideVisible(true)}>
                    <Feather name="help-circle" size={13} color={CLR.textMuted} />
                    <Text style={styles.statusGuideLinkText}>Status guide</Text>
                </RNTouchableOpacity>
            </GlassCard>

            {/* ── SECTION 2 · Active Case (or empty state) ──────────────── */}
            <SectionLabel text="Active Case" />

            {primaryCase ? (
                <Pressable
                    style={styles.caseCard}
                    onPress={() => onSelectCase(primaryCase)}
                    accessibilityRole="button"
                    accessibilityLabel={`Open case: ${primaryCase.chiefComplaint}`}
                >
                    <View style={styles.caseCardTop}>
                        <Text style={styles.caseTitle} numberOfLines={2}>
                            {primaryCase.chiefComplaint}
                        </Text>
                        <Feather name="chevron-right" size={18} color={CLR.textMuted} />
                    </View>

                    <View style={styles.caseCardMeta}>
                        <StatusBadge status={primaryCase.status} />
                        <SeverityBadge severity={primaryCase.severity} />
                    </View>

                    <View style={styles.caseCardFooter}>
                        <Feather name="arrow-right-circle" size={14} color={CLR.primary} />
                        <Text style={styles.nextStepText}>
                            {nextStep(primaryCase.status)}
                        </Text>
                    </View>

                    {activeCases.length > 1 && (
                        <RNTouchableOpacity
                            style={styles.viewAllLink}
                            onPress={() => onNav('cases')}
                        >
                            <Text style={styles.viewAllText}>
                                +{activeCases.length - 1} more case{activeCases.length > 2 ? 's' : ''} — View all
                            </Text>
                        </RNTouchableOpacity>
                    )}
                </Pressable>
            ) : (
                <GlassCard style={styles.emptyCard}>
                    <Feather name="inbox" size={28} color={CLR.textMuted} />
                    <Text style={styles.emptyTitle}>No active medical cases</Text>
                    <Text style={styles.emptySubtitle}>Submit a complaint to get started</Text>
                    <Pressable style={styles.emptyBtn} onPress={() => onNav('complaint')}>
                        <Feather name="plus" size={15} color="#fff" />
                        <Text style={styles.emptyBtnText}>Create New Complaint</Text>
                    </Pressable>
                </GlassCard>
            )}

            {/* ── SECTION 3 · Upcoming Follow-ups ────────────────────────── */}
            <SectionLabel text="Upcoming Follow-ups" />

            {followUps.length > 0 ? (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 12, paddingRight: 20 }}
                    style={{ marginHorizontal: -SP.xl, paddingHorizontal: SP.xl }}
                >
                    {followUps.map((f, i) => {
                        const urg = getUrgency(f.scheduledDate);
                        return (
                            <GlassCard key={f._id || i} style={[styles.actionCard, { width: 260 }]}>
                                <View style={styles.actionRow}>
                                    <View style={[styles.actionIconWrap, { backgroundColor: urg.bg }]}>
                                        <Feather name="calendar" size={16} color={urg.color} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Text style={styles.actionTitle}>Follow-up</Text>
                                            <View style={[styles.urgencyTag, { backgroundColor: urg.bg }]}>
                                                <Text style={[styles.urgencyText, { color: urg.color }]}>{urg.label}</Text>
                                            </View>
                                        </View>
                                        <Text style={styles.actionDetail} numberOfLines={1}>
                                            {f.case?.chiefComplaint || 'Consultation'}
                                        </Text>
                                        <Text style={styles.doctorName}>
                                            {f.assignedDoctor?.name ? `Dr. ${f.assignedDoctor.name}` : 'Assigned Doctor'}
                                        </Text>
                                    </View>
                                </View>
                                <Pressable
                                    style={styles.actionCardBtn}
                                    onPress={() => onSelectCase(f.case)}
                                >
                                    <Text style={styles.actionCardBtnText}>View Case Details</Text>
                                    <Feather name="arrow-right" size={12} color={CLR.primary} />
                                </Pressable>
                            </GlassCard>
                        );
                    })}
                </ScrollView>
            ) : (
                <GlassCard style={styles.actionCard}>
                    <View style={styles.actionRow}>
                        <View style={[styles.actionIconWrap, { backgroundColor: CLR.borderLight }]}>
                            <Feather name="check-circle" size={16} color={CLR.textMuted} />
                        </View>
                        <Text style={styles.noActionText}>No scheduled follow-ups</Text>
                    </View>
                </GlassCard>
            )}

            {/* ── SECTION 4 · Alerts (conditional) ─────────────────────── */}
            {hasAlerts && (
                <>
                    <SectionLabel text="Alerts" />
                    <View style={styles.alertsBlock}>
                        {criticalCase && (
                            <View style={styles.alertRow}>
                                <View style={[styles.alertBar, { backgroundColor: CLR.danger }]} />
                                <View style={styles.alertContent}>
                                    <View style={styles.alertTopRow}>
                                        <Feather name="alert-triangle" size={14} color={CLR.danger} />
                                        <Text style={styles.alertTitle}>Critical Case</Text>
                                    </View>
                                    <Text style={styles.alertBody} numberOfLines={2}>
                                        {criticalCase.chiefComplaint}
                                    </Text>
                                </View>
                                <Pressable
                                    style={styles.alertBtn}
                                    onPress={() => onSelectCase(criticalCase)}
                                >
                                    <Feather name="arrow-right" size={14} color={CLR.danger} />
                                </Pressable>
                            </View>
                        )}

                        {followupCase && (
                            <View style={[styles.alertRow, styles.alertRowFollowup]}>
                                <View style={[styles.alertBar, { backgroundColor: CLR.status.FOLLOWUP.dot }]} />
                                <View style={styles.alertContent}>
                                    <View style={styles.alertTopRow}>
                                        <Feather name="clock" size={14} color={CLR.status.FOLLOWUP.txt} />
                                        <Text style={[styles.alertTitle, { color: CLR.status.FOLLOWUP.txt }]}>
                                            Follow-up Required
                                        </Text>
                                    </View>
                                    <Text style={styles.alertBody}>
                                        Attend your scheduled consultation
                                    </Text>
                                </View>
                            </View>
                        )}
                    </View>
                </>
            )}

        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: {
        padding: SP.xl,
        paddingBottom: 48,
        gap: 12,
    },

    // ── Greeting
    greeting: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    greetName: {
        fontSize: 22,
        fontWeight: '700',
        color: CLR.textPri,
        letterSpacing: -0.4,
    },
    greetSub: {
        fontSize: 13,
        color: CLR.textMuted,
        marginTop: 2,
    },
    newComplaintBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 9,
        borderRadius: 12,
        gap: 7,
        ...Platform.select({
            web: {
                backgroundImage: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
                boxShadow: '0 4px 12px rgba(99,102,241,0.4)',
            },
            default: { backgroundColor: CLR.primary },
        }),
        ...SHADOW.sm,
    },
    newComplaintText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '700',
    },

    // ── Section label
    sectionLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: CLR.textMuted,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        marginTop: 4,
    },

    // ── Generic card
    card: { padding: 18 },

    // ── Card header row
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    cardIconWrap: {
        width: 28,
        height: 28,
        borderRadius: 8,
        backgroundColor: CLR.primaryTint,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: CLR.textPri,
        flex: 1,
    },
    activePill: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        backgroundColor: CLR.borderLight,
    },
    activePillOn: {
        backgroundColor: CLR.status.ASSIGNED.bg,
    },
    activePillText: {
        fontSize: 11,
        fontWeight: '700',
        color: CLR.textMuted,
    },
    activePillTextOn: {
        color: CLR.status.ASSIGNED.txt,
    },

    // ── Info block
    infoBlock: {
        gap: 10,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    infoLabel: {
        fontSize: 12,
        color: CLR.textMuted,
        width: 80,
    },
    infoValue: {
        fontSize: 13,
        fontWeight: '600',
        color: CLR.textPri,
        flex: 1,
    },
    statusGuideLink: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 14,
        alignSelf: 'flex-start',
    },
    statusGuideLinkText: {
        fontSize: 12,
        color: CLR.textMuted,
    },

    // ── Badges
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 9,
        paddingVertical: 4,
        borderRadius: 20,
    },
    badgeDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '700',
    },

    // ── Active case card
    caseCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: CLR.border,
        padding: 18,
        ...SHADOW.sm,
    },
    caseCardTop: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        marginBottom: 12,
    },
    caseTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: CLR.textPri,
        flex: 1,
        lineHeight: 21,
    },
    caseCardMeta: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
    },
    caseCardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: CLR.borderLight,
    },
    nextStepText: {
        fontSize: 12,
        color: CLR.primary,
        fontWeight: '600',
    },
    viewAllLink: {
        marginTop: 10,
        alignSelf: 'flex-end',
    },
    viewAllText: {
        fontSize: 12,
        color: CLR.primary,
        fontWeight: '600',
    },
    hovered: {
        opacity: 0.88,
    },

    // ── Empty state
    emptyCard: {
        padding: 36,
        alignItems: 'center',
    },
    emptyTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: CLR.textPri,
        marginTop: 12,
    },
    emptySubtitle: {
        fontSize: 13,
        color: CLR.textMuted,
        marginTop: 4,
    },
    emptyBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 12,
        marginTop: 20,
        gap: 8,
        ...Platform.select({
            web: {
                backgroundImage: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
                boxShadow: '0 4px 12px rgba(99,102,241,0.4)',
            },
            default: { backgroundColor: CLR.primary },
        }),
        ...SHADOW.sm,
    },
    emptyBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 13,
    },

    // ── Action card
    actionCard: {
        padding: 14,
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    actionIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: CLR.status.FOLLOWUP.bg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: CLR.textPri,
    },
    actionDetail: {
        fontSize: 12,
        color: CLR.textMuted,
        marginTop: 2,
    },
    doctorName: {
        fontSize: 11,
        color: CLR.textMuted,
        marginTop: 1,
    },
    urgencyTag: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    urgencyText: {
        fontSize: 10,
        fontWeight: '700',
    },
    actionCardBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        borderTopWidth: 1,
        borderTopColor: CLR.borderLight,
        marginTop: 12,
        gap: 6,
    },
    actionCardBtnText: {
        fontSize: 12,
        fontWeight: '700',
        color: CLR.primary,
    },
    noActionText: {
        fontSize: 13,
        color: CLR.textMuted,
    },

    // ── Alerts block
    alertsBlock: {
        gap: 10,
    },
    alertRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: CLR.danger + '08',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: CLR.danger + '22',
        overflow: 'hidden',
    },
    alertRowFollowup: {
        backgroundColor: CLR.status.FOLLOWUP.bg,
        borderColor: CLR.status.FOLLOWUP.dot + '40',
    },
    alertBar: {
        width: 4,
        alignSelf: 'stretch',
    },
    alertContent: {
        flex: 1,
        padding: 12,
        gap: 4,
    },
    alertTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    alertTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: CLR.danger,
    },
    alertBody: {
        fontSize: 12,
        color: CLR.textSec,
    },
    alertBtn: {
        padding: 14,
    },

    // ── Status guide modal
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: SP.xl,
    },
    guideCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        width: '100%',
        maxWidth: 440,
        maxHeight: '80%',
    },
    guideHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SP.base,
    },
    guideRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: CLR.borderLight,
    },
    guideDot: {
        width: 9,
        height: 9,
        borderRadius: 5,
        marginTop: 4,
    },
    guideKey: {
        fontSize: 13,
        fontWeight: '700',
    },
    guideDesc: {
        fontSize: 12,
        color: CLR.textSec,
        marginTop: 2,
    },
});

export default DashboardView;

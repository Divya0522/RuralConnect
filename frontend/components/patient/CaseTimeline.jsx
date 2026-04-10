import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { CLR, TY, SP } from '../../constants/DesignTokens';

const STEPS = [
    { key: 'NEW', label: 'New', desc: 'Complaint received' },
    { key: 'ASSIGNED', label: 'Assigned', desc: 'Doctor reviewing' },
    { key: 'DIAGNOSED', label: 'Diagnosed', desc: 'Treatment planned' },
    { key: 'FOLLOWUP', label: 'Follow-up', desc: 'Consultation set' },
    { key: 'ESCALATED', label: 'Escalated', desc: 'Urgent attention' },
    { key: 'SPECIALIST_REVIEW', label: 'Specialist', desc: 'Expert reviewing' },
    { key: 'RESOLVED', label: 'Resolved', desc: 'Case closed' },
    { key: 'CLOSED', label: 'Closed', desc: 'Completed' },
];

// Plain-language status description shown below the tracker
const STEP_DESCRIPTIONS = {
    NEW: 'Your complaint is in the queue. A doctor will be assigned shortly.',
    ASSIGNED: 'A doctor has been assigned and is currently reviewing your case.',
    DIAGNOSED: 'Your diagnosis is ready. Check the treatment plan below.',
    FOLLOWUP: 'A follow-up appointment has been scheduled for you.',
    ESCALATED: 'Your case needs urgent attention and has been escalated.',
    SPECIALIST_REVIEW: 'A specialist is now reviewing your case.',
    RESOLVED: 'Your case has been resolved. Take care and follow the advice given.',
    CLOSED: 'This case is now closed. Contact us if symptoms return.',
};

const CaseTimeline = ({ currentStatus }) => {
    const currentIndex = STEPS.findIndex(s => s.key === currentStatus);
    const description = STEP_DESCRIPTIONS[currentStatus] || 'Your case is being processed.';

    return (
        <View style={styles.container}>
            <View style={styles.titleRow}>
                <Text style={TY.h3}>Case Progress</Text>
                <View style={[styles.statusPill, { backgroundColor: CLR.status[currentStatus]?.bg || CLR.bg }]}>
                    <View style={[styles.statusDot, { backgroundColor: CLR.status[currentStatus]?.dot || CLR.textMuted }]} />
                    <Text style={[styles.statusPillText, { color: CLR.status[currentStatus]?.txt || CLR.textSec }]}>
                        {currentStatus?.replace(/_/g, ' ')}
                    </Text>
                </View>
            </View>

            {/* Plain-language explanation */}
            <Text style={styles.statusDesc}>{description}</Text>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {STEPS.map((step, index) => {
                    const isCompleted = index < currentIndex;
                    const isCurrent = index === currentIndex;
                    const isLast = index === STEPS.length - 1;

                    return (
                        <View key={step.key} style={styles.stepWrapper}>
                            <View style={styles.stepContent}>
                                <View style={[
                                    styles.circle,
                                    isCompleted && styles.completedCircle,
                                    isCurrent && styles.currentCircle,
                                ]}>
                                    {isCompleted ? (
                                        <Feather name="check" size={14} color="#fff" />
                                    ) : (
                                        <Text style={[
                                            styles.stepNumber,
                                            isCurrent && { color: '#fff' }
                                        ]}>
                                            {index + 1}
                                        </Text>
                                    )}
                                </View>
                                <Text style={[
                                    styles.stepLabel,
                                    isCurrent && styles.currentLabel,
                                    isCompleted && styles.completedLabel,
                                ]}>
                                    {step.label}
                                </Text>
                            </View>
                            {!isLast && (
                                <View style={[styles.line, isCompleted && styles.completedLine]} />
                            )}
                        </View>
                    );
                })}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: CLR.border,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        gap: 6,
    },
    statusDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
    },
    statusPillText: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    statusDesc: {
        fontSize: 13,
        color: CLR.textSec,
        marginBottom: SP.base,
        lineHeight: 19,
    },
    scrollContent: {
        alignItems: 'center',
        paddingVertical: 10,
    },
    stepWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    stepContent: {
        alignItems: 'center',
        width: 80,
    },
    circle: {
        width: 30,
        height: 30,
        borderRadius: 15,
        borderWidth: 2,
        borderColor: CLR.border,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    completedCircle: {
        backgroundColor: CLR.success,
        borderColor: CLR.success,
    },
    currentCircle: {
        backgroundColor: CLR.primary,
        borderColor: CLR.primary,
        transform: [{ scale: 1.1 }],
    },
    stepNumber: {
        fontSize: 12,
        fontWeight: '700',
        color: CLR.textMuted,
    },
    stepLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: CLR.textMuted,
        textAlign: 'center',
    },
    currentLabel: {
        color: CLR.primary,
        fontWeight: '700',
    },
    completedLabel: {
        color: CLR.textPri,
    },
    line: {
        width: 40,
        height: 2,
        backgroundColor: CLR.border,
        marginTop: -20,
    },
    completedLine: {
        backgroundColor: CLR.success,
    },
});

export default CaseTimeline;

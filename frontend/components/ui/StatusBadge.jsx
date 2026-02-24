// components/ui/StatusBadge.jsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { STATUS_COLORS, STATUS_LABELS, SEVERITY_COLORS } from '../../constants/config';

export function StatusBadge({ status }) {
    const color = STATUS_COLORS[status] || '#6B7280';
    const label = STATUS_LABELS[status] || status;
    return (
        <View style={[styles.badge, { backgroundColor: color + '22', borderColor: color }]}>
            <Text style={[styles.text, { color }]}>{label}</Text>
        </View>
    );
}

export function SeverityBadge({ severity }) {
    const color = SEVERITY_COLORS[severity] || '#6B7280';
    return (
        <View style={[styles.badge, { backgroundColor: color + '22', borderColor: color }]}>
            <Text style={[styles.text, { color }]}>{severity?.toUpperCase()}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3,
        alignSelf: 'flex-start',
    },
    text: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
});

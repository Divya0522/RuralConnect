// components/ui/StatCard.jsx - Statistics summary card
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/config';

export default function StatCard({ label, value, icon, color = COLORS.primary, sub }) {
    return (
        <View style={[styles.card, { borderTopColor: color }]}>
            <View style={[styles.iconCircle, { backgroundColor: color + '1A' }]}>
                <Text style={styles.icon}>{icon}</Text>
            </View>
            <Text style={[styles.value, { color }]}>{value ?? '—'}</Text>
            <Text style={styles.label}>{label}</Text>
            {sub ? <Text style={styles.sub}>{sub}</Text> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        flex: 1, backgroundColor: COLORS.surface, borderRadius: 16, padding: 16,
        margin: 4, elevation: 3, borderTopWidth: 3,
        shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 8,
    },
    iconCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
    icon: { fontSize: 20 },
    value: { fontSize: 26, fontWeight: '800', marginBottom: 2 },
    label: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500' },
    sub: { fontSize: 11, color: COLORS.textLight, marginTop: 2 },
});

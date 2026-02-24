// components/ui/Card.jsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/config';

export default function Card({ children, style, padding = 16 }) {
    return (
        <View style={[styles.card, { padding }, style]}>
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.07,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 2 },
        marginBottom: 12,
    },
});

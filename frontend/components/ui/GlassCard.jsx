import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { CLR, SHADOW } from '../../constants/DesignTokens';

const GlassCard = ({ children, style, intensity = 0.8 }) => {
    const isWeb = Platform.OS === 'web';

    return (
        <View style={[
            styles.card,
            isWeb && { backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' },
            { backgroundColor: `rgba(255, 255, 255, ${intensity})` },
            SHADOW.md,
            style
        ]}>
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
        padding: 20,
        overflow: 'hidden',
    },
});

export default GlassCard;

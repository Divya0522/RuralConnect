/**
 * components/ui/Skeleton.jsx
 * Animated skeleton placeholders — no cross-module constant imports (Metro-safe)
 */
import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

function SkeletonBox({ width = '100%', height = 20, radius = 8, style }) {
    const opacity = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 1.0, duration: 700, useNativeDriver: true }),
            ])
        );
        pulse.start();
        return () => pulse.stop();
    }, [opacity]);

    return (
        <Animated.View
            style={[
                { width, height, borderRadius: radius, backgroundColor: '#E5E7EB' },
                { opacity },
                style,
            ]}
        />
    );
}

function StatCardSkeleton() {
    return (
        <View style={sk.card}>
            <View style={sk.cardTop}>
                <View style={{ gap: 8 }}>
                    <SkeletonBox width={90} height={12} radius={6} />
                    <SkeletonBox width={56} height={28} radius={8} />
                </View>
                <SkeletonBox width={48} height={48} radius={14} />
            </View>
            <View style={{ marginTop: 14 }}>
                <SkeletonBox width={100} height={12} radius={6} />
            </View>
        </View>
    );
}

function CaseRowSkeleton({ count = 4 }) {
    return (
        <View style={{ gap: 0 }}>
            {Array.from({ length: count }).map((_, i) => (
                <View key={i} style={[sk.row, i < count - 1 && { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }]}>
                    <SkeletonBox width={44} height={44} radius={22} />
                    <View style={{ flex: 1, gap: 8, marginLeft: 12 }}>
                        <SkeletonBox width="55%" height={13} radius={6} />
                        <SkeletonBox width="80%" height={12} radius={6} />
                    </View>
                    <View style={{ gap: 8, alignItems: 'flex-end' }}>
                        <SkeletonBox width={60} height={24} radius={999} />
                        <SkeletonBox width={90} height={24} radius={999} />
                    </View>
                </View>
            ))}
        </View>
    );
}

const sk = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    cardTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 4,
    },
});

export { SkeletonBox, StatCardSkeleton, CaseRowSkeleton };

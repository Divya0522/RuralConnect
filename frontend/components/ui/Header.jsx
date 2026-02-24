// components/ui/Header.jsx - Top navigation bar
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS } from '../../constants/config';

export default function Header({ title, subtitle, showBack = false, rightElement }) {
    const router = useRouter();
    return (
        <View style={styles.header}>
            <View style={styles.left}>
                {showBack && (
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Text style={styles.backIcon}>←</Text>
                    </TouchableOpacity>
                )}
                <View>
                    <Text style={styles.title}>{title}</Text>
                    {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
                </View>
            </View>
            {rightElement && <View>{rightElement}</View>}
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        backgroundColor: COLORS.primary,
        paddingTop: 50,
        paddingBottom: 16,
        paddingHorizontal: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    left: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    backBtn: { marginRight: 12, padding: 4 },
    backIcon: { color: '#fff', fontSize: 20, fontWeight: '700' },
    title: { color: '#fff', fontSize: 20, fontWeight: '800' },
    subtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 },
});

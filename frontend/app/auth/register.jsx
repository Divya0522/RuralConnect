import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Pressable
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useAuth } from '../../context/AuthContext';
import { COLORS, ROLE_LIST, ROLE_LABELS } from '../../constants/config';

export default function RegisterScreen() {
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'patient' });
    const [showPassword, setShowPassword] = useState(false);
    const [showRoles, setShowRoles] = useState(false);
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const router = useRouter();

    const set = (key) => (val) => setForm(f => ({ ...f, [key]: val }));

    const handleRegister = async () => {
        if (!form.name || !form.email || !form.password) {
            Toast.show({ type: 'error', text1: 'Validation', text2: 'All fields required.' });
            return;
        }
        if (form.password.length < 6) {
            Toast.show({ type: 'error', text1: 'Validation', text2: 'Password must be at least 6 characters.' });
            return;
        }
        setLoading(true);
        try {
            await register(form);
            router.replace('/dashboard');
        } catch (err) {
            Toast.show({ type: 'error', text1: 'Registration Failed', text2: err.response?.data?.error || 'Something went wrong.' });
        } finally {
            setLoading(false);
        }
    };

    const WEB = Platform.OS === 'web';
    const NO_OUTLINE = WEB ? { outlineStyle: 'none' } : {};

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* Header Section */}
                <View style={styles.header}>
                    <View style={styles.logoBox}>
                        <Ionicons name="heart" size={24} color="#fff" />
                    </View>
                    <Text style={styles.title}>Rural Health Connect</Text>
                    <Text style={styles.subtitle}>Bridging healthcare to every village</Text>
                </View>

                {/* Register Card */}
                <View style={[styles.card, WEB && styles.webCard]}>
                    <Text style={styles.cardHeader}>Create Account</Text>
                    <Text style={styles.cardInfo}>Register as a new user</Text>

                    {/* Full Name Field */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Full Name</Text>
                        <TextInput
                            style={[styles.input, NO_OUTLINE]}
                            value={form.name}
                            onChangeText={set('name')}
                            placeholder="John Doe"
                            placeholderTextColor={COLORS.textLight}
                            autoCapitalize="words"
                        />
                    </View>

                    {/* Email Field */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={[styles.input, NO_OUTLINE]}
                            value={form.email}
                            onChangeText={set('email')}
                            placeholder="you@example.com"
                            placeholderTextColor={COLORS.textLight}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>

                    {/* Password Field */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Password</Text>
                        <View style={styles.passWrap}>
                            <TextInput
                                style={[styles.input, { flex: 1, borderTopRightRadius: 0, borderBottomRightRadius: 0, borderRightWidth: 0 }, NO_OUTLINE]}
                                value={form.password}
                                onChangeText={set('password')}
                                placeholder="••••••••"
                                placeholderTextColor={COLORS.textLight}
                                secureTextEntry={!showPassword}
                            />
                            <Pressable
                                style={styles.eyeBtn}
                                onPress={() => setShowPassword(!showPassword)}
                            >
                                <Feather name={showPassword ? "eye-off" : "eye"} size={18} color={COLORS.textSecondary} />
                            </Pressable>
                        </View>
                    </View>

                    {/* Role Selector */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Role</Text>
                        <Pressable
                            style={styles.pickerBtn}
                            onPress={() => setShowRoles(!showRoles)}
                        >
                            <Text style={styles.pickerTxt}>{ROLE_LABELS[form.role]}</Text>
                            <Feather name="chevron-down" size={16} color={COLORS.textSecondary} />
                        </Pressable>

                        {showRoles && (
                            <View style={styles.dropdown}>
                                {ROLE_LIST.map((r) => (
                                    <Pressable
                                        key={r.value}
                                        style={styles.dropItem}
                                        onPress={() => { set('role')(r.value); setShowRoles(false); }}
                                    >
                                        <Text style={[styles.dropItemTxt, form.role === r.value && styles.dropItemActive]}>{r.label}</Text>
                                    </Pressable>
                                ))}
                            </View>
                        )}
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={loading}>
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Create Account</Text>}
                    </TouchableOpacity>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>Already have an account? </Text>
                    <TouchableOpacity onPress={() => router.push('/auth/login')}>
                        <Text style={styles.footerLink}>Sign in</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    scroll: { flexGrow: 1, padding: 24, justifyContent: 'center', alignItems: 'center' },

    header: { alignItems: 'center', marginBottom: 40 },
    logoBox: {
        width: 48, height: 48, borderRadius: 12,
        backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
        marginBottom: 16, elevation: 4,
    },
    title: { fontSize: 26, fontWeight: '800', color: '#111827', textAlign: 'center' },
    subtitle: { fontSize: 15, color: '#6B7280', marginTop: 4, textAlign: 'center' },

    card: {
        backgroundColor: '#fff', borderRadius: 16, padding: 32,
        width: '100%',
        shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5,
        marginBottom: 24,
    },
    webCard: { maxWidth: 460 },

    cardHeader: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 4 },
    cardInfo: { fontSize: 13, color: '#6B7280', marginBottom: 24 },

    inputGroup: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8 },
    input: {
        borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8,
        padding: 12, fontSize: 14, color: '#111827', backgroundColor: '#F9FAFB',
    },

    passWrap: { flexDirection: 'row', alignItems: 'center' },
    eyeBtn: {
        height: 46, paddingHorizontal: 15, justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, borderColor: '#D1D5DB', borderLeftWidth: 0, borderTopRightRadius: 8, borderBottomRightRadius: 8,
        backgroundColor: '#F9FAFB'
    },

    pickerBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8,
        padding: 12, backgroundColor: '#F9FAFB'
    },
    pickerTxt: { fontSize: 14, color: '#111827' },

    dropdown: {
        marginTop: 4, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8,
        backgroundColor: '#fff', elevation: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10,
        overflow: 'hidden', position: 'absolute', top: 74, left: 0, right: 0, zIndex: 100,
    },
    dropItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    dropItemTxt: { fontSize: 14, color: '#374151' },
    dropItemActive: { color: COLORS.primary, fontWeight: '600' },

    btn: {
        backgroundColor: COLORS.primary, borderRadius: 8, padding: 14,
        alignItems: 'center', elevation: 2,
    },
    btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

    footer: { flexDirection: 'row', justifyContent: 'center' },
    footerText: { color: '#6B7280', fontSize: 14 },
    footerLink: { color: COLORS.primary, fontSize: 14, fontWeight: '600' },
});

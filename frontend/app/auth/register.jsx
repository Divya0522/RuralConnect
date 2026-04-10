/**
 * app/auth/register.jsx
 */
import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
    Pressable, useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useAuth } from '../../context/AuthContext';
import { ROLE_LIST } from '../../constants/config';

const WEB = Platform.OS === 'web';
const NO_OUTLINE = WEB ? { outlineStyle: 'none' } : {};

const PRIMARY = '#4f46e5';
const PRIMARY_HOVER = '#6366f1';
const CARD_BG = 'rgba(18,25,45,0.85)';
const BORDER = '#2d375a';
const TEXT_HEADING = '#ffffff';
const TEXT_BODY = '#cbd5e1';
const TEXT_MUTED = '#9aa8c0';

function InputField({ icon, ...textInputProps }) {
    const [focused, setFocused] = useState(false);
    return (
        <View style={[R.inputBox, focused && R.inputBoxFocused]}>
            {icon && (
                <Feather name={icon} size={18} color={focused ? PRIMARY : TEXT_MUTED} style={{ marginRight: 12 }} />
            )}
            <TextInput
                {...textInputProps}
                style={[R.inputText, NO_OUTLINE, textInputProps.style]}
                placeholderTextColor={TEXT_MUTED}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
            />
        </View>
    );
}

function PasswordField({ value, onChangeText }) {
    const [show, setShow] = useState(false);
    const [focused, setFocused] = useState(false);
    return (
        <View style={[R.inputBox, focused && R.inputBoxFocused]}>
            <Feather name="lock" size={18} color={focused ? PRIMARY : TEXT_MUTED} style={{ marginRight: 12 }} />
            <TextInput
                style={[R.inputText, { flex: 1 }, NO_OUTLINE]}
                value={value}
                onChangeText={onChangeText}
                placeholder="Min. 6 characters"
                placeholderTextColor={TEXT_MUTED}
                secureTextEntry={!show}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
            />
            <Pressable onPress={() => setShow(s => !s)} style={{ padding: 4 }}>
                <Feather name={show ? 'eye-off' : 'eye'} size={18} color={TEXT_MUTED} />
            </Pressable>
        </View>
    );
}

const ROLE_ICON = {
    patient: 'user', junior_doctor: 'activity', senior_doctor: 'award',
    admin: 'shield', helper_doctor: 'users'
};

export default function RegisterScreen() {
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'patient' });
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const router = useRouter();
    const { width } = useWindowDimensions();
    const isWide = WEB && width > 860;

    const setName = (v) => setForm(f => ({ ...f, name: v }));
    const setEmail = (v) => setForm(f => ({ ...f, email: v }));
    const setPassword = (v) => setForm(f => ({ ...f, password: v }));

    const handleRegister = async () => {
        if (!form.name || !form.email || !form.password) {
            Toast.show({ type: 'error', text1: 'Missing Fields', text2: 'All fields are required.' });
            return;
        }
        if (form.password.length < 6) {
            Toast.show({ type: 'error', text1: 'Weak Password', text2: 'Password must be at least 6 characters.' });
            return;
        }
        setLoading(true);
        try {
            await register(form);
            router.replace('/dashboard');
        } catch (err) {
            Toast.show({ type: 'error', text1: 'Registration Failed', text2: err.response?.data?.error || 'Something went wrong. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    const card = (
        <View style={[R.card, isWide && R.cardWide]}>
            <View style={R.cardAccent} />

            {!isWide && (
                <View style={R.logoRow}>
                    <View style={[R.logoMark, { backgroundColor: 'transparent' }]}>
                        <FontAwesome5 name="heart" size={26} color="#000" style={{ position: 'absolute' }} />
                        <FontAwesome5 name="heartbeat" size={26} color={PRIMARY} />
                    </View>
                    <View>
                        <Text style={R.logoName}>RuralConnect</Text>
                    </View>
                </View>
            )}

            <Text style={R.cardTitle}>Create account</Text>
            <Text style={R.cardSub}>Join the rural healthcare network</Text>

            <View style={R.fieldWrap}>
                <Text style={R.label}>Full name</Text>
                <InputField
                    icon="user"
                    value={form.name}
                    onChangeText={setName}
                    placeholder="Your full name"
                    autoCapitalize="words"
                    autoComplete="name"
                />
            </View>

            <View style={R.fieldWrap}>
                <Text style={R.label}>Email address</Text>
                <InputField
                    icon="mail"
                    value={form.email}
                    onChangeText={setEmail}
                    placeholder="you@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                />
            </View>

            <View style={R.fieldWrap}>
                <Text style={R.label}>Password</Text>
                <PasswordField value={form.password} onChangeText={setPassword} />
            </View>

            <View style={R.fieldWrap}>
                <Text style={R.label}>I am registering as</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 4 }}>
                    {ROLE_LIST.map(r => {
                        const isActive = form.role === r.value;
                        return (
                            <Pressable
                                key={r.value}
                                onPress={() => setForm(f => ({ ...f, role: r.value }))}
                                style={[R.rolePill, isActive && R.rolePillActive]}
                            >
                                <Feather name={ROLE_ICON[r.value] || 'user'} size={15} color={isActive ? TEXT_HEADING : TEXT_BODY} />
                                <Text style={[R.rolePillTxt, isActive && R.rolePillTxtActive]}>{r.label}</Text>
                            </Pressable>
                        );
                    })}
                </ScrollView>
            </View>

            <Text style={R.terms}>
                By creating an account, you agree to our{' '}
                <Text style={{ color: PRIMARY_HOVER, fontWeight: '500' }}>Terms of Service</Text>
                {' & '}
                <Text style={{ color: PRIMARY_HOVER, fontWeight: '500' }}>Privacy Policy</Text>.
            </Text>

            <TouchableOpacity style={[R.submitBtn, loading && { opacity: 0.75 }]} onPress={handleRegister} disabled={loading} activeOpacity={0.85}>
                {loading
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <><Text style={R.submitTxt}>Create Account</Text><Feather name="arrow-right" size={18} color="#fff" style={{ marginLeft: 8 }} /></>
                }
            </TouchableOpacity>

            <View style={R.footerRow}>
                <Text style={R.footerTxt}>Already have an account? </Text>
                <TouchableOpacity onPress={() => router.push('/auth/login')}>
                    <Text style={R.footerLink}>Sign in →</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const content = (
        <View style={[R.root, isWide && { flexDirection: 'row' }]}>
            {isWide && (
                <View style={R.leftSide}>
                    <View style={R.glowBlobTop} />
                    <View style={R.glowBlobBottom} />
                    <View style={R.leftContent}>
                        <View style={R.bigLogoWrap}>
                            <View style={[R.bigLogoMark, { backgroundColor: 'transparent' }]}>
                                <FontAwesome5 name="heart" size={48} color="#000" style={{ position: 'absolute' }} />
                                <FontAwesome5 name="heartbeat" size={48} color={PRIMARY} />
                            </View>
                        </View>
                        <Text style={R.leftH1}>Start your{'\n'}health journey</Text>
                        <Text style={R.leftSub}>Register to access quality healthcare{'\n'}services right from your village.</Text>

                        <View style={R.statsRow}>
                            {[['50+', 'Villages'], ['1,000+', 'Patients'], ['30+', 'Doctors']].map(([v, l], i) => (
                                <View key={i} style={R.statBox}>
                                    <Text style={R.statVal}>{v}</Text>
                                    <Text style={R.statLab}>{l}</Text>
                                </View>
                            ))}
                        </View>

                        <View style={R.bullets}>
                            {[
                                ['check-circle', 'Free for all patients'],
                                ['check-circle', 'Instant case registration'],
                                ['check-circle', 'Track your health timeline'],
                                ['check-circle', 'Download prescriptions anytime'],
                            ].map(([icon, text], i) => (
                                <View key={i} style={R.bullet}>
                                    <Feather name={icon} size={16} color={PRIMARY_HOVER} />
                                    <Text style={R.bulletTxt}>{text}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>
            )}

            <View style={R.rightSide}>
                {card}
            </View>
        </View>
    );

    return (
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#0a0f1e' }} behavior="padding">
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false} bounces={false}>
                {content}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const R = StyleSheet.create({
    root: {
        flex: 1,
        ...(WEB ? {
            backgroundImage: `linear-gradient(135deg, #0a0f1e 0%, #141b33 100%)`,
            minHeight: '100vh',
        } : { backgroundColor: '#0a0f1e' }),
    },

    // ── Left Side (Branding) ──────────────────────────────────────────
    leftSide: {
        width: 440,
        justifyContent: 'center',
        padding: 64,
        position: 'relative',
        overflow: 'hidden',
        borderRightWidth: 1,
        borderRightColor: 'rgba(255,255,255,0.05)',
        ...(WEB ? { backdropFilter: 'blur(20px)' } : {}),
    },
    glowBlobTop: {
        position: 'absolute', top: -100, left: -100, width: 300, height: 300,
        borderRadius: 150, backgroundColor: PRIMARY, opacity: 0.15,
        ...(WEB ? { filter: 'blur(100px)' } : {}),
    },
    glowBlobBottom: {
        position: 'absolute', bottom: -100, right: -100, width: 250, height: 250,
        borderRadius: 125, backgroundColor: '#818CF8', opacity: 0.1,
        ...(WEB ? { filter: 'blur(80px)' } : {}),
    },
    leftContent: { alignItems: 'flex-start', width: '100%', zIndex: 10 },
    bigLogoWrap: { marginBottom: 40 },
    bigLogoMark: {
        width: 80, height: 80, borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.03)',
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
        ...(WEB ? { boxShadow: `0 0 50px rgba(79,70,229,0.3)` } : {}),
    },
    leftH1: { color: TEXT_HEADING, fontSize: 36, fontWeight: '700', lineHeight: 46, marginBottom: 16, letterSpacing: -0.5, fontFamily: 'Inter' },
    leftSub: { color: TEXT_MUTED, fontSize: 16, lineHeight: 26, marginBottom: 40, fontFamily: 'Inter' },

    statsRow: {
        flexDirection: 'row', gap: 12, marginBottom: 40, width: '100%',
        backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 20,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
    },
    statBox: { flex: 1, alignItems: 'center' },
    statVal: { color: PRIMARY_HOVER, fontSize: 24, fontWeight: '700', fontFamily: 'Inter' },
    statLab: { color: TEXT_MUTED, fontSize: 12, fontWeight: '500', marginTop: 4, fontFamily: 'Inter' },

    bullets: { gap: 16 },
    bullet: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    bulletTxt: { color: TEXT_BODY, fontSize: 15, fontWeight: '500', fontFamily: 'Inter' },

    // ── Right Side ────────────────────────────────────────────────
    rightSide: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },

    // ── Card ──────────────────────────────────────────────────────
    card: {
        width: '100%', maxWidth: 420,
        backgroundColor: CARD_BG,
        borderRadius: 24,
        paddingHorizontal: 32, paddingBottom: 32, paddingTop: 32,
        borderWidth: 1,
        borderColor: BORDER,
        ...(WEB ? {
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), 0 0 30px rgba(79,70,229,0.1)',
            backdropFilter: 'blur(16px)',
        } : { elevation: 20 }),
    },
    cardWide: { maxWidth: 440 },
    cardAccent: {
        position: 'absolute', top: 0, left: 0, right: 0, height: 4,
        ...(WEB ? { backgroundImage: `linear-gradient(90deg, ${PRIMARY} 0%, #818CF8 100%)` } : { backgroundColor: PRIMARY }),
    },

    logoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
    logoMark: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
    logoName: { color: TEXT_HEADING, fontSize: 18, fontWeight: '700', fontFamily: 'Inter' },

    cardTitle: { fontSize: 24, fontWeight: '600', color: TEXT_HEADING, marginBottom: 6, fontFamily: 'Inter' },
    cardSub: { fontSize: 14, color: TEXT_MUTED, marginBottom: 32, fontFamily: 'Inter' },

    // ── Fields ────────────────────────────────────────────────────
    fieldWrap: { marginBottom: 20 },
    label: { fontSize: 13, fontWeight: '500', color: TEXT_BODY, marginBottom: 8, fontFamily: 'Inter' },
    inputBox: {
        flexDirection: 'row', alignItems: 'center',
        borderWidth: 1, borderColor: BORDER,
        borderRadius: 14, paddingHorizontal: 16,
        height: 48, backgroundColor: 'rgba(10,15,30,0.5)',
        ...(WEB ? { transition: 'all 0.2s ease', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)' } : {}),
    },
    inputBoxFocused: {
        borderColor: PRIMARY,
        backgroundColor: 'rgba(18,25,45,0.9)',
        ...(WEB ? { boxShadow: `0 0 0 4px rgba(79,70,229,0.15), inset 0 2px 4px rgba(0,0,0,0.2)` } : {}),
    },
    inputText: { flex: 1, fontSize: 15, color: TEXT_HEADING, fontWeight: '400', fontFamily: 'Inter' },

    // ── Role selector (Pills) ─────────────────────────────────────
    rolePill: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        borderWidth: 1, borderColor: BORDER, borderRadius: 12,
        paddingHorizontal: 16, height: 42, backgroundColor: 'rgba(10,15,30,0.5)',
        ...(WEB ? { transition: 'all 0.2s ease' } : {}),
    },
    rolePillActive: {
        borderColor: PRIMARY, backgroundColor: 'rgba(79,70,229,0.2)',
        ...(WEB ? { boxShadow: `0 4px 12px rgba(79,70,229,0.2)` } : {}),
    },
    rolePillTxt: { fontSize: 14, color: TEXT_BODY, fontWeight: '500', fontFamily: 'Inter' },
    rolePillTxtActive: { color: TEXT_HEADING, fontWeight: '600' },

    terms: { fontSize: 13, color: TEXT_MUTED, lineHeight: 20, marginBottom: 24, fontFamily: 'Inter' },

    // ── Submit button ─────────────────────────────────────────────
    submitBtn: {
        height: 50, borderRadius: 14,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        marginBottom: 24,
        ...(WEB ? {
            backgroundImage: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_HOVER} 100%)`,
            boxShadow: `0 4px 14px rgba(79,70,229,0.4)`,
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        } : { backgroundColor: PRIMARY, elevation: 4 }),
    },
    submitTxt: { color: '#ffffff', fontSize: 16, fontWeight: '600', fontFamily: 'Inter' },

    // ── Footer ────────────────────────────────────────────────────
    footerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    footerTxt: { color: TEXT_MUTED, fontSize: 14, fontFamily: 'Inter' },
    footerLink: { color: PRIMARY_HOVER, fontSize: 14, fontWeight: '600', fontFamily: 'Inter' },
});

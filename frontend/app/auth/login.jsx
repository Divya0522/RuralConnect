/**
 * app/auth/login.jsx
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

function InputField({ icon, rightElement, ...textInputProps }) {
    const [focused, setFocused] = useState(false);
    return (
        <View style={[L.inputBox, focused && L.inputBoxFocused]}>
            {icon && (
                <Feather
                    name={icon}
                    size={18}
                    color={focused ? PRIMARY : TEXT_MUTED}
                    style={{ marginRight: 12 }}
                />
            )}
            <TextInput
                {...textInputProps}
                style={[L.inputText, NO_OUTLINE, textInputProps.style]}
                placeholderTextColor={TEXT_MUTED}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
            />
            {rightElement}
        </View>
    );
}

function PasswordField({ value, onChangeText, placeholder }) {
    const [show, setShow] = useState(false);
    const [focused, setFocused] = useState(false);
    return (
        <View style={[L.inputBox, focused && L.inputBoxFocused]}>
            <Feather name="lock" size={18} color={focused ? PRIMARY : TEXT_MUTED} style={{ marginRight: 12 }} />
            <TextInput
                style={[L.inputText, { flex: 1 }, NO_OUTLINE]}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder || '••••••••'}
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

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('patient');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const router = useRouter();
    const { width } = useWindowDimensions();
    const isWide = WEB && width > 860;

    const handleLogin = async () => {
        if (!email || !password) {
            Toast.show({ type: 'error', text1: 'Missing Fields', text2: 'Please enter your email and password.' });
            return;
        }
        setLoading(true);
        try {
            await login(email.trim(), password, role);
            router.replace('/dashboard');
        } catch (err) {
            Toast.show({ type: 'error', text1: 'Login Failed', text2: err.response?.data?.error || 'Incorrect email or password.' });
        } finally {
            setLoading(false);
        }
    };

    const card = (
        <View style={[L.card, isWide && L.cardWide]}>
            <View style={L.cardAccent} />

            {!isWide && (
                <View style={L.logoRow}>
                    <View style={[L.logoMark, { backgroundColor: 'transparent' }]}>
                        <FontAwesome5 name="heart" size={26} color="#000" style={{ position: 'absolute' }} />
                        <FontAwesome5 name="heartbeat" size={26} color={PRIMARY} />
                    </View>
                    <View>
                        <Text style={L.logoName}>RuralConnect</Text>
                    </View>
                </View>
            )}

            <Text style={L.cardTitle}>Welcome back</Text>
            <Text style={L.cardSub}>Sign in to your healthcare portal</Text>

            <View style={L.fieldWrap}>
                <Text style={L.label}>Email address</Text>
                <InputField
                    icon="mail"
                    value={email}
                    onChangeText={setEmail}
                    placeholder="you@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                />
            </View>

            <View style={L.fieldWrap}>
                <View style={[L.rowBetween, { marginBottom: 8 }]}>
                    <Text style={L.label}>Password</Text>
                    <TouchableOpacity>
                        <Text style={L.forgotTxt}>Forgot password?</Text>
                    </TouchableOpacity>
                </View>
                <PasswordField value={password} onChangeText={setPassword} placeholder="••••••••" />
            </View>

            <View style={L.fieldWrap}>
                <Text style={L.label}>Sign in as</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 4 }}>
                    {ROLE_LIST.map(r => {
                        const isActive = role === r.value;
                        return (
                            <Pressable
                                key={r.value}
                                onPress={() => setRole(r.value)}
                                style={[L.rolePill, isActive && L.rolePillActive]}
                            >
                                <Feather name={ROLE_ICON[r.value] || 'user'} size={15} color={isActive ? TEXT_HEADING : TEXT_BODY} />
                                <Text style={[L.rolePillTxt, isActive && L.rolePillTxtActive]}>{r.label}</Text>
                            </Pressable>
                        );
                    })}
                </ScrollView>
            </View>

            <TouchableOpacity style={[L.submitBtn, loading && { opacity: 0.75 }]} onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
                {loading
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <><Text style={L.submitTxt}>Sign In</Text><Feather name="arrow-right" size={18} color="#fff" style={{ marginLeft: 8 }} /></>
                }
            </TouchableOpacity>

            <View style={L.dividerRow}>
                <View style={L.dividerLine} />
                <Text style={L.dividerTxt}>or</Text>
                <View style={L.dividerLine} />
            </View>

            <View style={L.footerRow}>
                <Text style={L.footerTxt}>Don't have an account? </Text>
                <TouchableOpacity onPress={() => router.push('/auth/register')}>
                    <Text style={L.footerLink}>Create one →</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const content = (
        <View style={[L.root, isWide && { flexDirection: 'row' }]}>
            {isWide && (
                <View style={L.leftSide}>
                    <View style={L.glowBlobTop} />
                    <View style={L.glowBlobBottom} />
                    <View style={L.leftContent}>
                        <View style={L.bigLogoWrap}>
                            <View style={[L.bigLogoMark, { backgroundColor: 'transparent' }]}>
                                <FontAwesome5 name="heart" size={48} color="#000" style={{ position: 'absolute' }} />
                                <FontAwesome5 name="heartbeat" size={48} color={PRIMARY} />
                            </View>
                        </View>
                        <Text style={L.leftH1}>Rural Health{'\n'}Connect</Text>
                        <Text style={L.leftSub}>Bridging the gap between{'\n'}villages and world-class healthcare.</Text>
                        <View style={L.leftBullets}>
                            {[
                                ['activity', 'Real-time Case Tracking'],
                                ['users', 'Multi-role Collaboration'],
                                ['shield', 'Secure Medical Records'],
                                ['globe', 'Serving 50+ Villages'],
                            ].map(([icon, text], i) => (
                                <View key={i} style={L.bullet}>
                                    <View style={L.bulletIcon}><Feather name={icon} size={16} color={PRIMARY_HOVER} /></View>
                                    <Text style={L.bulletTxt}>{text}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>
            )}

            <View style={L.rightSide}>
                {card}
                <View style={L.trustRow}>
                    {['50+ Villages', '1000+ Patients', 'Govt. Backed'].map((t, i) => (
                        <View key={i} style={L.trustBadge}>
                            <Text style={L.trustTxt}>{t}</Text>
                        </View>
                    ))}
                </View>
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

const L = StyleSheet.create({
    root: {
        flex: 1,
        ...(WEB ? {
            backgroundImage: `linear-gradient(135deg, #0a0f1e 0%, #141b33 100%)`,
            minHeight: '100vh',
        } : { backgroundColor: '#0a0f1e' }),
    },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

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
    leftH1: { color: TEXT_HEADING, fontSize: 36, fontWeight: '600', lineHeight: 46, marginBottom: 16, letterSpacing: -0.5, fontFamily: 'Inter' },
    leftSub: { color: TEXT_MUTED, fontSize: 16, lineHeight: 26, marginBottom: 48, fontFamily: 'Inter' },
    leftBullets: { gap: 24 },
    bullet: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    bulletIcon: {
        width: 36, height: 36, borderRadius: 10,
        backgroundColor: 'rgba(79,70,229,0.15)',
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: 'rgba(79,70,229,0.3)',
    },
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
    logoName: { color: TEXT_HEADING, fontSize: 18, fontWeight: '600', fontFamily: 'Inter' },

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
        ...(WEB ? { transition: 'all 0.2s ease' } : {}),
    },
    inputBoxFocused: {
        borderColor: PRIMARY,
        backgroundColor: 'rgba(18,25,45,0.9)',
        ...(WEB ? { boxShadow: `0 0 0 4px rgba(79,70,229,0.15)` } : {}),
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

    // ── Submit button ─────────────────────────────────────────────
    submitBtn: {
        height: 50, borderRadius: 14,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        marginTop: 8, marginBottom: 24,
        ...(WEB ? {
            backgroundImage: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_HOVER} 100%)`,
            boxShadow: `0 4px 14px rgba(79,70,229,0.4)`,
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        } : { backgroundColor: PRIMARY, elevation: 4 }),
    },
    submitTxt: { color: '#ffffff', fontSize: 16, fontWeight: '600', fontFamily: 'Inter' },

    // ── Divider ───────────────────────────────────────────────────
    dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
    dividerLine: { flex: 1, height: 1, backgroundColor: BORDER },
    dividerTxt: { color: TEXT_MUTED, fontSize: 13, paddingHorizontal: 16, fontFamily: 'Inter' },

    // ── Footer ────────────────────────────────────────────────────
    footerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    footerTxt: { color: TEXT_MUTED, fontSize: 14, fontFamily: 'Inter' },
    footerLink: { color: PRIMARY_HOVER, fontSize: 14, fontWeight: '600', fontFamily: 'Inter' },
    forgotTxt: { color: PRIMARY_HOVER, fontSize: 13, fontWeight: '500', fontFamily: 'Inter' },

    // ── Trust badges ──────────────────────────────────────────────
    trustRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, flexWrap: 'wrap', marginTop: 32 },
    trustBadge: {
        borderWidth: 1, borderColor: BORDER, backgroundColor: 'rgba(18,25,45,0.6)',
        borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6,
    },
    trustTxt: { fontSize: 12, color: TEXT_MUTED, fontWeight: '500', fontFamily: 'Inter' },
});

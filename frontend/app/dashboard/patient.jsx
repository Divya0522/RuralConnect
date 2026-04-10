/**
 * app/dashboard/patient.jsx
 * UPGRADED PATIENT MODULE — Production-grade healthcare platform.
 * Modular, animated, and feature-rich.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, ActivityIndicator } from 'react-native';
import { Feather, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import Animated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated';

// Context & API
import { useAuth } from '../../context/AuthContext';
import api, { caseService, notificationService, followUpService } from '../../services/api';

// Components
import { CLR, TY, SP, SHADOW } from '../../constants/DesignTokens';
import DashboardView from '../../components/patient/DashboardView';
import CasesView from '../../components/patient/CasesView';
import ComplaintView from '../../components/patient/ComplaintView';
import CaseDetailView from '../../components/patient/CaseDetailView';
import NotificationBell from '../../components/patient/NotificationBell';
import EmergencyButton from '../../components/patient/EmergencyButton';

const NAV_ITEMS = [
    { key: 'dashboard', icon: 'grid', label: 'Dashboard' },
    { key: 'cases', icon: 'clipboard', label: 'Medical History' },
    { key: 'complaint', icon: 'plus-circle', label: 'New Complaint' },
];

export default function PatientDashboard() {
    const { user, logout } = useAuth();
    const [nav, setNav] = useState('dashboard');
    const [cases, setCases] = useState([]);
    const [followUps, setFollowUps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selCase, setSelCase] = useState(null);

    const loadData = useCallback(async () => {
        try {
            const [cr, fr] = await Promise.all([
                caseService.list({ limit: 100 }),
                followUpService.list({ isCompleted: false, limit: 10 })
            ]);
            setCases(cr.data.data || []);
            setFollowUps(fr.data.data || []);
        } catch (e) {
            console.error('Data load error:', e);
            Toast.show({ type: 'error', text1: 'Connection Error', text2: 'Failed to sync with healthcare records.' });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const refresh = () => { setRefreshing(true); loadData(); };

    const handleEmergency = async () => {
        try {
            // Logic to create an emergency case directly
            const fd = new FormData();
            fd.append('chiefComplaint', 'EMERGENCY ALERT: Patient triggered emergency mode');
            fd.append('severity', 'critical');
            await caseService.create(fd);
            refresh();
            setNav('cases');
        } catch (e) {
            Toast.show({ type: 'error', text1: 'Alert Failed', text2: 'Please try calling local emergency services.' });
        }
    };

    if (selCase) {
        return (
            <Animated.View entering={FadeIn} style={styles.fullscreen}>
                <CaseDetailView caseData={selCase} onClose={() => setSelCase(null)} />
            </Animated.View>
        );
    }

    return (
        <View style={styles.root}>
            {/* Sidebar */}
            <View style={styles.sidebar}>
                <View style={styles.brand}>
                    <View style={styles.logoBox}>
                        <FontAwesome5 name="heart" size={24} color="#000" style={{ position: 'absolute' }} />
                        <FontAwesome5 name="heartbeat" size={24} color="#6366F1" />
                    </View>
                    <View>
                        <Text style={styles.brandText}>RuralConnect</Text>
                        <Text style={styles.brandSub}>PATIENT PORTAL</Text>
                    </View>
                </View>

                <View style={styles.nav}>
                    {NAV_ITEMS.map(item => (
                        <Pressable
                            key={item.key}
                            style={[styles.navItem, nav === item.key && styles.navActive]}
                            onPress={() => setNav(item.key)}
                        >
                            <Feather name={item.icon} size={20} color={nav === item.key ? CLR.primary : CLR.textMuted} />
                            <Text style={[styles.navText, nav === item.key && styles.navTextActive]}>{item.label}</Text>
                        </Pressable>
                    ))}
                </View>

                <View style={styles.sidebarFooter}>
                    <Pressable style={styles.profileBtn}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{user?.name?.charAt(0)}</Text>
                        </View>
                        <View style={{ marginLeft: 12 }}>
                            <Text style={styles.userName}>{user?.name}</Text>
                            <Text style={[TY.small, { color: 'rgba(255,255,255,0.6)', fontWeight: '600' }]}>Patient</Text>
                        </View>
                    </Pressable>
                    <Pressable style={styles.logoutBtn} onPress={logout}>
                        <Feather name="log-out" size={18} color={CLR.danger} />
                        <Text style={styles.logoutText}>Sign Out</Text>
                    </Pressable>
                </View>
            </View>

            {/* Main Content */}
            <View style={styles.main}>
                <View style={styles.topBar}>
                    <View style={styles.searchBarRoot}>
                        <Feather name="shield" size={18} color={CLR.primary} />
                        <Text style={[TY.bodySemi, { marginLeft: 10 }]}>Secure Patient Environment</Text>
                    </View>
                    <View style={styles.topBarActions}>
                        <EmergencyButton onConfirm={handleEmergency} />
                        <View style={styles.vDivider} />
                        <NotificationBell onSelectCase={setSelCase} />
                    </View>
                </View>

                <View style={styles.content}>
                    {loading ? (
                        <View style={styles.center}>
                            <ActivityIndicator size="large" color={CLR.primary} />
                            <Text style={[TY.bodyMuted, { marginTop: 16 }]}>Loading your healthcare dashboard...</Text>
                        </View>
                    ) : (
                        <Animated.View layout={Layout.springify()} style={{ flex: 1 }}>
                            {nav === 'dashboard' && (
                                <DashboardView
                                    user={user}
                                    cases={cases}
                                    followUps={followUps}
                                    loading={loading}
                                    refreshing={refreshing}
                                    onRefresh={refresh}
                                    onNav={setNav}
                                    onSelectCase={setSelCase}
                                    onEmergency={handleEmergency}
                                />
                            )}
                            {nav === 'cases' && (
                                <CasesView
                                    cases={cases}
                                    loading={loading}
                                    refreshing={refreshing}
                                    onRefresh={refresh}
                                    onSelectCase={setSelCase}
                                />
                            )}
                            {nav === 'complaint' && (
                                <ComplaintView
                                    user={user}
                                    onSuccess={() => { setNav('cases'); refresh(); }}
                                />
                            )}
                        </Animated.View>
                    )}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: CLR.bg,
    },
    fullscreen: {
        flex: 1,
    },
    sidebar: {
        width: 280,
        backgroundColor: CLR.sidebarBg,
        borderRightWidth: 0,
        padding: 24,
    },
    brand: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 40,
        gap: 12,
    },
    logoBox: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
    },
    brandText: {
        fontSize: 20,
        fontWeight: '800',
        color: '#F1F5F9',
        letterSpacing: -0.5,
    },
    brandSub: {
        fontSize: 10,
        fontWeight: '700',
        color: CLR.sidebarText,
        letterSpacing: 1,
    },
    nav: {
        flex: 1,
    },
    navItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 13,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginBottom: 4,
        gap: 12,
    },
    navActive: {
        backgroundColor: CLR.sidebarActive,
    },
    navText: {
        fontSize: 14,
        fontWeight: '600',
        color: CLR.sidebarText,
    },
    navTextActive: {
        color: CLR.sidebarTextActive,
    },
    sidebarFooter: {
        marginTop: 'auto',
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.07)',
        paddingTop: 16,
    },
    profileBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: CLR.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },
    userName: {
        fontSize: 13,
        fontWeight: '700',
        color: '#F1F5F9',
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        gap: 10,
        borderRadius: 10,
    },
    logoutText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#F87171',
    },
    main: {
        flex: 1,
    },
    topBar: {
        height: 80,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: CLR.border,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 32,
        zIndex: 100,
    },
    searchBarRoot: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: CLR.bg,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        width: 300,
    },
    topBarActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    vDivider: {
        width: 1,
        height: 24,
        backgroundColor: CLR.border,
    },
    content: {
        flex: 1,
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    }
});

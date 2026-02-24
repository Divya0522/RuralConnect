// app/dashboard/index.jsx - Role-based dashboard router
import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../constants/config';

export default function DashboardRouter() {
    const { user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!user) return;
        switch (user.role) {
            case 'patient': router.replace('/dashboard/patient'); break;
            case 'helpline_operator': router.replace('/dashboard/helpline'); break;
            case 'junior_doctor': router.replace('/dashboard/junior-doctor'); break;
            case 'senior_doctor': router.replace('/dashboard/senior-doctor'); break;
            case 'panchayat_officer': router.replace('/dashboard/panchayat'); break;
            case 'admin': router.replace('/dashboard/admin'); break;
            default: router.replace('/auth/login');
        }
    }, [user]);

    return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background }}>
            <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
    );
}

import { AuthProvider, useAuth } from '../context/AuthContext';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { StatusBar, View, ActivityIndicator } from 'react-native';
import Toast from 'react-native-toast-message';
import { COLORS } from '../constants/config';

function AuthGuard({ children }) {
    const { isAuthenticated, loading } = useAuth();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        if (loading) return;

        const inAuthGroup = segments[0] === 'auth';
        const atRoot = segments.length === 0;

        if (!isAuthenticated && !inAuthGroup) {
            router.replace('/auth/login');
        } else if (isAuthenticated && (inAuthGroup || atRoot)) {
            router.replace('/dashboard');
        }
    }, [isAuthenticated, loading, segments]);

    if (loading) {
        return (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background }}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return children;
}

export default function RootLayout() {
    return (
        <AuthProvider>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
            <AuthGuard>
                <Stack screenOptions={{ headerShown: false }} />
            </AuthGuard>
            <Toast />
        </AuthProvider>
    );
}

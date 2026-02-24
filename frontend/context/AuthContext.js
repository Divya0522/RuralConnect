// context/AuthContext.js - Authentication state management

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Load user from storage on app start
    const loadStoredAuth = useCallback(async () => {
        try {
            const stored = await AsyncStorage.getItem('user');
            const token = await AsyncStorage.getItem('accessToken');
            if (stored && token) {
                setUser(JSON.parse(stored));
                setIsAuthenticated(true);
            }
        } catch {
            // storage error – start fresh
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadStoredAuth();
    }, [loadStoredAuth]);

    const login = async (email, password) => {
        const res = await authService.login({ email, password });
        const { user: userData, accessToken, refreshToken } = res.data.data;
        await AsyncStorage.multiSet([
            ['accessToken', accessToken],
            ['refreshToken', refreshToken],
            ['user', JSON.stringify(userData)],
        ]);
        setUser(userData);
        setIsAuthenticated(true);
        return userData;
    };

    const register = async (formData) => {
        const res = await authService.register(formData);
        const { user: userData, accessToken, refreshToken } = res.data.data;
        await AsyncStorage.multiSet([
            ['accessToken', accessToken],
            ['refreshToken', refreshToken],
            ['user', JSON.stringify(userData)],
        ]);
        setUser(userData);
        setIsAuthenticated(true);
        return userData;
    };

    const logout = async () => {
        try { await authService.logout(); } catch { }
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
        setUser(null);
        setIsAuthenticated(false);
    };

    const updateStoredUser = async (updatedUser) => {
        setUser(updatedUser);
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
    };

    return (
        <AuthContext.Provider value={{ user, loading, isAuthenticated, login, register, logout, updateStoredUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};

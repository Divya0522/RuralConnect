// services/api.js - Axios instance with JWT interceptors

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/config';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor — attach access token
api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor — handle token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 &&
            error.response?.data?.code === 'TOKEN_EXPIRED' &&
            !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const refreshToken = await AsyncStorage.getItem('refreshToken');
                if (!refreshToken) throw new Error('No refresh token');

                const res = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
                const { accessToken, refreshToken: newRefresh } = res.data.data;

                await AsyncStorage.setItem('accessToken', accessToken);
                await AsyncStorage.setItem('refreshToken', newRefresh);

                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

// Auth service
export const authService = {
    login: (data) => api.post('/auth/login', data),
    register: (data) => api.post('/auth/register', data),
    refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
    logout: () => api.post('/auth/logout'),
    me: () => api.get('/auth/me'),
};

// Cases service
export const caseService = {
    list: (params) => api.get('/cases', { params }),
    get: (id) => api.get(`/cases/${id}`),
    create: (formData) => api.post('/cases', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    assign: (id, data) => api.patch(`/cases/${id}/assign`, data),
    updateStatus: (id, data) => api.patch(`/cases/${id}/status`, data),
    requestSeniorReview: (id, data) => api.patch(`/cases/${id}/request-senior-review`, data),
};

// Patients service
export const patientService = {
    me: () => api.get('/patients/me'),
    list: (params) => api.get('/patients', { params }),
    get: (id) => api.get(`/patients/${id}`),
    create: (data) => api.post('/patients', data),
    update: (id, data) => api.put(`/patients/${id}`, data),
    delete: (id) => api.delete(`/patients/${id}`),
};

// Reports service
export const reportService = {
    list: (params) => api.get('/reports', { params }),
    get: (id) => api.get(`/reports/${id}`),
    create: (formData) => api.post('/reports', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    update: (id, data) => api.put(`/reports/${id}`, data),
};

// Diagnoses service
export const diagnosisService = {
    list: (params) => api.get('/diagnoses', { params }),
    get: (id) => api.get(`/diagnoses/${id}`),
    create: (data) => api.post('/diagnoses', data),
    update: (id, data) => api.put(`/diagnoses/${id}`, data),
};

// Follow-up service
export const followUpService = {
    list: (params) => api.get('/followups', { params }),
    create: (data) => api.post('/followups', data),
    complete: (id, data) => api.patch(`/followups/${id}/complete`, data),
};

// Villages service
export const villageService = {
    list: (params) => api.get('/villages', { params }),
    get: (id) => api.get(`/villages/${id}`),
    create: (data) => api.post('/villages', data),
    update: (id, data) => api.put(`/villages/${id}`, data),
};

// Notifications service
export const notificationService = {
    list: (params) => api.get('/notifications', { params }),
    markRead: (id) => api.patch(`/notifications/${id}/read`),
    markAllRead: () => api.patch('/notifications/read-all'),
    delete: (id) => api.delete(`/notifications/${id}`),
};

// Users service
export const userService = {
    list: (params) => api.get('/users', { params }),
    get: (id) => api.get(`/users/${id}`),
    update: (id, data) => api.put(`/users/${id}`, data),
    deactivate: (id) => api.delete(`/users/${id}`),
    resetPassword: (id, data) => api.patch(`/users/${id}/reset-password`, data),
};

// Analytics service
export const analyticsService = {
    summary: () => api.get('/analytics/summary'),
    village: (id) => api.get(`/analytics/village/${id}`),
    diseaseTrends: () => api.get('/analytics/disease-trends'),
    doctorsPerformance: () => api.get('/analytics/doctors-performance'),
};

// Logs service
export const logService = {
    list: (params) => api.get('/logs', { params }),
};

export default api;

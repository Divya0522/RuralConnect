// API configuration and constants

export const API_BASE_URL = 'http://localhost:5000/api';

export const ROLES = {
    PATIENT: 'patient',
    HELPLINE_OPERATOR: 'helpline_operator',
    JUNIOR_DOCTOR: 'junior_doctor',
    SENIOR_DOCTOR: 'senior_doctor',
    PANCHAYAT_OFFICER: 'panchayat_officer',
    ADMIN: 'admin',
};

export const ROLE_LABELS = {
    patient: 'Patient',
    helpline_operator: 'Helpline Operator',
    junior_doctor: 'Junior Doctor',
    senior_doctor: 'Senior Doctor',
    panchayat_officer: 'Panchayat Health Officer',
    admin: 'Administrator',
};

export const ROLE_LIST = Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }));

export const CASE_STATUS = {
    SUBMITTED: 'submitted',
    ASSIGNED: 'assigned',
    VISITED: 'visited',
    REVIEWED: 'reviewed',
    TREATED: 'treated',
    FOLLOWUP: 'followup',
    CLOSED: 'closed',
};

export const STATUS_COLORS = {
    submitted: '#F59E0B',
    assigned: '#3B82F6',
    visited: '#8B5CF6',
    reviewed: '#06B6D4',
    treated: '#10B981',
    followup: '#F97316',
    closed: '#6B7280',
};

export const STATUS_LABELS = {
    submitted: 'Submitted',
    assigned: 'Assigned',
    visited: 'Visited',
    reviewed: 'Reviewed',
    treated: 'Treated',
    followup: 'Follow-up',
    closed: 'Closed',
};

export const SEVERITY_COLORS = {
    low: '#10B981',
    medium: '#F59E0B',
    high: '#EF4444',
    critical: '#7C3AED',
};

// Medical theme colors
export const COLORS = {
    primary: '#1E88E5',        // Medical Blue
    primaryLight: '#64B5F6',
    primaryDark: '#1565C0',
    secondary: '#26A69A',       // Soft Teal/Green
    secondaryLight: '#80CBC4',
    accent: '#43A047',          // Health Green
    background: '#F0F4F8',
    surface: '#FFFFFF',
    text: '#1A237E',
    textSecondary: '#546E7A',
    textLight: '#90A4AE',
    border: '#E3EAF0',
    error: '#EF5350',
    success: '#43A047',
    warning: '#FFA726',
    info: '#29B6F6',
    white: '#FFFFFF',
};

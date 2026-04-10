import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TextInput,
    ActivityIndicator, RefreshControl, Platform, Pressable, KeyboardAvoidingView
} from 'react-native';
import { Feather, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useAuth } from '../../context/AuthContext';
import { caseService, userService, villageService } from '../../services/api';
import { CLR, TY, SP, SHADOW } from '../../constants/DesignTokens';
import { StatusBadge, SeverityBadge } from '../../components/ui/StatusBadge';
import { CaseRowSkeleton } from '../../components/ui/Skeleton';
import NotificationBell from '../../components/patient/NotificationBell';

const WEB = Platform.OS === 'web';
const NO_OUTLINE = WEB ? { outlineStyle: 'none' } : {};

const PRI_MAP = {
    critical: { label: 'Critical', bg: '#FEF2F2', txt: '#991B1B' },
    high: { label: 'High', bg: '#FEE2E2', txt: '#B91C1C' },
    medium: { label: 'Medium', bg: CLR.status.FOLLOWUP.bg, txt: CLR.status.FOLLOWUP.txt },
    low: { label: 'Low', bg: CLR.status.ASSIGNED.bg, txt: CLR.status.ASSIGNED.txt },
};

function Btn({ style, activeStyle, onPress, disabled, children }) {
    const [hov, setHov] = useState(false);
    return (
        <Pressable
            onPress={onPress}
            disabled={disabled}
            {...(WEB ? { onHoverIn: () => setHov(true), onHoverOut: () => setHov(false) } : {})}
            style={[style, hov && activeStyle, disabled && { opacity: 0.5 }]}
        >
            {children}
        </Pressable>
    );
}

function AvatarCircle({ name = '?', size = 32, style }) {
    return (
        <View style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: CLR.border }, style]}>
            <Text style={{ fontSize: size * 0.4, fontWeight: '700', color: '#475569' }}>{name.charAt(0).toUpperCase()}</Text>
        </View>
    );
}

function SidebarItem({ icon, label, active, onPress }) {
    return (
        <Btn style={[styles.navItem, active && styles.navItemActive]} onPress={onPress}>
            <Feather name={icon} size={18} color={active ? '#FFFFFF' : '#94A3B8'} />
            <Text style={[styles.navLabel, active && styles.navLabelActive]}>{label}</Text>
        </Btn>
    );
}

export default function HelperDoctorDashboard() {
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('unassigned'); // unassigned, assigned, add
    const [cases, setCases] = useState([]);
    const [juniorDoctors, setJuniorDoctors] = useState([]);
    const [seniorDoctors, setSeniorDoctors] = useState([]);
    const [villages, setVillages] = useState([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [selectedCases, setSelectedCases] = useState([]);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [assigningLoading, setAssigningLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const loadData = useCallback(async () => {
        try {
            const [cRes, jdRes, sdRes, vRes] = await Promise.all([
                caseService.list({ limit: 100 }),
                userService.list({ role: 'junior_doctor' }).catch(() => ({ data: { data: [] } })),
                userService.list({ role: 'senior_doctor' }).catch(() => ({ data: { data: [] } })),
                villageService.list().catch(() => ({ data: { data: [] } }))
            ]);
            setCases(cRes.data.data || []);
            setJuniorDoctors(jdRes.data.data || []);
            setSeniorDoctors(sdRes.data.data || []);
            setVillages(vRes.data.data || []);
        } catch (e) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Could not fetch data.' });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const handleRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const toggleCaseSelection = (id) => {
        setSelectedCases(prev => prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]);
    };

    const handleAssign = async (doctorId) => {
        if (selectedCases.length === 0) return;
        setAssigningLoading(true);
        try {
            // Bulk assign or single assign one by one
            for (const caseId of selectedCases) {
                await caseService.assign(caseId, { assignedTo: doctorId });
            }
            Toast.show({ type: 'success', text1: 'Success', text2: `Assigned ${selectedCases.length} patient(s)` });
            setShowAssignModal(false);
            setSelectedCases([]);
            handleRefresh(); // Refresh list immediately
        } catch (e) {
            Toast.show({ type: 'error', text1: 'Error', text2: e.response?.data?.error || 'Assignment failed.' });
        } finally {
            setAssigningLoading(false);
        }
    };

    // Filters for tabs
    const unassignedCases = cases.filter(c => c.status === 'DRAFT' || c.status === 'NEW');
    const assignedCases = cases.filter(c => c.status !== 'DRAFT' && c.status !== 'NEW');
    const displayedUnassigned = unassignedCases.filter(c => c.patient?.name?.toLowerCase().includes(searchQuery.toLowerCase()));
    const displayedAssigned = assignedCases.filter(c => c.patient?.name?.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <View style={styles.container}>
            {/* Sidebar */}
            <View style={styles.sidebar}>
                <View style={styles.sidebarHeader}>
                    <View style={styles.logoCircle}>
                        <FontAwesome5 name="heartbeat" size={24} color="#FFF" />
                    </View>
                    <View>
                        <Text style={styles.logoName}>Helper</Text>
                        <Text style={styles.logoTag}>TRIAGE & OPS</Text>
                    </View>
                </View>
                <View style={styles.sidebarContent}>
                    <Text style={styles.sidebarHeading}>NAVIGATION</Text>
                    <SidebarItem icon="users" label={`Unassigned (${unassignedCases.length})`} active={activeTab === 'unassigned'} onPress={() => setActiveTab('unassigned')} />
                    <SidebarItem icon="check-square" label={`Assigned (${assignedCases.length})`} active={activeTab === 'assigned'} onPress={() => setActiveTab('assigned')} />
                    <SidebarItem icon="user-plus" label="Add Patient" active={activeTab === 'add'} onPress={() => setActiveTab('add')} />
                </View>
                <View style={styles.sidebarFooter}>
                    <View style={styles.userCard}>
                        <View style={styles.userAvatar}>
                            <Text style={styles.userInitials}>{user?.name?.[0]}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.userNameSide} numberOfLines={1}>{user?.name}</Text>
                            <Text style={styles.userRoleSide}>Helper Doctor</Text>
                        </View>
                    </View>
                    <Pressable style={styles.signOutBtn} onPress={logout}>
                        <Feather name="log-out" size={18} color={CLR.danger} />
                        <Text style={styles.signOutTxt}>Sign Out</Text>
                    </Pressable>
                </View>
            </View>

            {/* Main Content */}
            <View style={styles.main}>
                <View style={styles.topHeader}>
                    <Text style={TY.h2}>Helper Doctor Portal</Text>
                    <NotificationBell />
                </View>

                {activeTab === 'unassigned' && (
                    <UnassignedPanel
                        cases={displayedUnassigned}
                        loading={loading}
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        selectedCases={selectedCases}
                        toggleCaseSelection={toggleCaseSelection}
                        onAssignClick={() => setShowAssignModal(true)}
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        selectAll={() => setSelectedCases(displayedUnassigned.map(c => c._id))}
                        deselectAll={() => setSelectedCases([])}
                    />
                )}

                {activeTab === 'assigned' && (
                    <AssignedPanel
                        cases={displayedAssigned}
                        loading={loading}
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                    />
                )}

                {activeTab === 'add' && (
                    <AddPatientForm
                        villages={villages}
                        onSuccess={() => { setActiveTab('unassigned'); handleRefresh(); }}
                    />
                )}
            </View>

            {/* Assign Modal */}
            {showAssignModal && (
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Assign to Doctor ({selectedCases.length} selected)</Text>
                            <Pressable onPress={() => setShowAssignModal(false)}><Feather name="x" size={24} color={CLR.textSec} /></Pressable>
                        </View>
                        <ScrollView style={styles.modalBody}>
                            <Text style={styles.modalSectionTitle}>Junior Doctors</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.doctorHList}>
                                {juniorDoctors.map(doc => (
                                    <DoctorCard key={doc._id} doc={doc} loading={assigningLoading} onSelect={() => handleAssign(doc._id)} />
                                ))}
                                {juniorDoctors.length === 0 && <Text style={styles.emptyTxt}>No Junior Doctors available</Text>}
                            </ScrollView>

                            <Text style={[styles.modalSectionTitle, { marginTop: 24 }]}>Senior Doctors</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.doctorHList}>
                                {seniorDoctors.map(doc => (
                                    <DoctorCard key={doc._id} doc={doc} loading={assigningLoading} onSelect={() => handleAssign(doc._id)} isSenior />
                                ))}
                                {seniorDoctors.length === 0 && <Text style={styles.emptyTxt}>No Senior Doctors available</Text>}
                            </ScrollView>
                        </ScrollView>
                    </View>
                </View>
            )}
        </View>
    );
}


function UnassignedPanel({ cases, loading, refreshing, onRefresh, selectedCases, toggleCaseSelection, onAssignClick, searchQuery, setSearchQuery, selectAll, deselectAll }) {
    return (
        <View style={styles.panelContainer}>
            <View style={styles.tableToolbar}>
                <View style={styles.tableSearch}>
                    <Feather name="search" size={18} color={CLR.textSec} style={{ marginRight: 10 }} />
                    <TextInput style={[styles.tableSearchInput, NO_OUTLINE]} placeholder="Search patients..." value={searchQuery} onChangeText={setSearchQuery} />
                </View>
                {selectedCases.length > 0 && (
                    <Btn style={styles.assignSelectedBtn} onPress={onAssignClick}>
                        <Feather name="user-check" size={16} color="#fff" style={{ marginRight: 8 }} />
                        <Text style={{ color: '#fff', fontWeight: '600' }}>Assign Selected ({selectedCases.length})</Text>
                    </Btn>
                )}
            </View>

            <View style={styles.tableWrapper}>
                <View style={styles.tableHeader}>
                    <View style={{ width: 40, alignItems: 'center' }}>
                        <Btn onPress={selectedCases.length === cases.length && cases.length > 0 ? deselectAll : selectAll}>
                            <Feather name={selectedCases.length === cases.length && cases.length > 0 ? "check-square" : "square"} size={18} color={CLR.textPri} />
                        </Btn>
                    </View>
                    <Text style={[styles.colHeader, { flex: 1.5 }]}>Patient</Text>
                    <Text style={[styles.colHeader, { flex: 1 }]}>Village</Text>
                    <Text style={[styles.colHeader, { flex: 2 }]}>Complaint</Text>
                    <Text style={[styles.colHeader, { width: 100, textAlign: 'center' }]}>Severity</Text>
                    <Text style={[styles.colHeader, { width: 120, textAlign: 'center' }]}>Created</Text>
                </View>

                <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
                    {loading ? <CaseRowSkeleton count={5} /> :
                        cases.length === 0 ? <Text style={styles.emptyTxt}>No unassigned patients found.</Text> :
                            cases.map(c => {
                                const selected = selectedCases.includes(c._id);
                                return (
                                    <Pressable key={c._id} style={[styles.tr, selected && { backgroundColor: CLR.primarySoft }]} onPress={() => toggleCaseSelection(c._id)}>
                                        <View style={{ width: 40, alignItems: 'center' }}>
                                            <Feather name={selected ? "check-square" : "square"} size={18} color={selected ? CLR.primary : CLR.border} />
                                        </View>
                                        <Text style={[styles.tdText, { flex: 1.5, fontWeight: '600' }]}>{c.patient?.name}</Text>
                                        <Text style={[styles.tdText, { flex: 1 }]}>{c.village?.name || 'Unknown'}</Text>
                                        <Text style={[styles.tdText, { flex: 2 }]} numberOfLines={1}>{c.chiefComplaint}</Text>
                                        <View style={{ width: 100, alignItems: 'center' }}>
                                            <SeverityBadge severity={c.severity} />
                                        </View>
                                        <Text style={[styles.tdText, { width: 120, textAlign: 'center', fontSize: 13 }]}>{new Date(c.createdAt).toLocaleDateString()}</Text>
                                    </Pressable>
                                );
                            })
                    }
                </ScrollView>
            </View>
        </View>
    );
}

function AssignedPanel({ cases, loading, refreshing, onRefresh, searchQuery, setSearchQuery }) {
    return (
        <View style={styles.panelContainer}>
            <View style={styles.tableToolbar}>
                <View style={styles.tableSearch}>
                    <Feather name="search" size={18} color={CLR.textSec} style={{ marginRight: 10 }} />
                    <TextInput style={[styles.tableSearchInput, NO_OUTLINE]} placeholder="Search patients..." value={searchQuery} onChangeText={setSearchQuery} />
                </View>
            </View>

            <View style={styles.tableWrapper}>
                <View style={styles.tableHeader}>
                    <Text style={[styles.colHeader, { flex: 1.5 }]}>Patient</Text>
                    <Text style={[styles.colHeader, { flex: 1.5 }]}>Assigned Doctor</Text>
                    <Text style={[styles.colHeader, { width: 120, textAlign: 'center' }]}>Status</Text>
                    <Text style={[styles.colHeader, { width: 140, textAlign: 'center' }]}>Date</Text>
                </View>

                <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
                    {loading ? <CaseRowSkeleton count={5} /> :
                        cases.length === 0 ? <Text style={styles.emptyTxt}>No assigned cases found.</Text> :
                            cases.map(c => (
                                <View key={c._id} style={styles.tr}>
                                    <View style={[styles.tdText, { flex: 1.5, flexDirection: 'row', alignItems: 'center' }]}>
                                        <AvatarCircle name={c.patient?.name} size={30} style={{ marginRight: 12 }} />
                                        <Text style={{ fontWeight: '600', color: CLR.textPri }}>{c.patient?.name}</Text>
                                    </View>
                                    <View style={[styles.tdText, { flex: 1.5, flexDirection: 'row', alignItems: 'center' }]}>
                                        {c.assignedTo ? (
                                            <>
                                                <AvatarCircle name={c.assignedTo?.name} size={30} style={{ marginRight: 12 }} />
                                                <View>
                                                    <Text style={{ fontWeight: '600', color: CLR.textPri }}>Dr. {c.assignedTo?.name}</Text>
                                                    <Text style={{ fontSize: 11, color: CLR.textSec }}>{c.assignedDoctorRole === 'senior_doctor' ? 'Senior' : 'Junior'}</Text>
                                                </View>
                                            </>
                                        ) : (
                                            <Text style={styles.tdText}>Unassigned</Text>
                                        )}
                                    </View>
                                    <View style={{ width: 120, alignItems: 'center' }}>
                                        <StatusBadge status={c.status} />
                                    </View>
                                    <Text style={[styles.tdText, { width: 140, textAlign: 'center', fontSize: 13 }]}>{new Date(c.assignedAt || c.createdAt).toLocaleDateString()}</Text>
                                </View>
                            ))
                    }
                </ScrollView>
            </View>
        </View>
    );
}

export function AddPatientForm({ villages, onSuccess }) {
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        name: '', age: '', gender: 'male', phone: '', village: villages[0]?._id || '',
        chiefComplaint: '', symptoms: '', severity: 'medium', notes: ''
    });

    const set = k => v => setForm(f => ({ ...f, [k]: v }));

    const submit = async () => {
        if (!form.name || !form.age || !form.chiefComplaint) {
            Toast.show({ type: 'error', text1: 'Required', text2: 'Name, age, and complaint are required.' });
            return;
        }

        setSubmitting(true);
        try {
            // The Patient routes allow helper_doctor to create patients now.
            const { patientService } = require('../../services/api');

            const pRes = await patientService.create({
                name: form.name,
                age: parseInt(form.age),
                gender: form.gender,
                phone: form.phone,
                village: form.village || villages[0]?._id,
            });

            const patientId = pRes.data.data._id;

            const formData = new FormData();
            formData.append('patient', patientId);
            formData.append('chiefComplaint', form.chiefComplaint);
            formData.append('severity', form.severity);
            if (form.notes) formData.append('notes', form.notes);
            if (form.village) formData.append('village', form.village);
            form.symptoms.split(',').map(s => s.trim()).filter(Boolean).forEach(s => {
                formData.append('symptoms', s);
            });

            await caseService.create(formData);

            Toast.show({ type: 'success', text1: 'Case Created', text2: 'Patient added and case marked as Draft.' });
            onSuccess();
        } catch (e) {
            Toast.show({ type: 'error', text1: 'Failed', text2: e.response?.data?.error || 'Could not create case.' });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <ScrollView style={styles.formContainer} contentContainerStyle={{ padding: 24, paddingBottom: 60 }}>
            <View style={styles.formCard}>
                <Text style={styles.formSectionTitle}>Patient Details</Text>

                <View style={styles.formGrid}>
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Full Name *</Text>
                        <TextInput style={styles.input} value={form.name} onChangeText={set('name')} placeholder="Patient Name" />
                    </View>
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Age *</Text>
                        <TextInput style={styles.input} value={form.age} onChangeText={set('age')} placeholder="e.g. 45" keyboardType="numeric" />
                    </View>
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Phone Number</Text>
                        <TextInput style={styles.input} value={form.phone} onChangeText={set('phone')} placeholder="Phone" keyboardType="phone-pad" />
                    </View>
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Gender</Text>
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            {['male', 'female', 'other'].map(g => (
                                <Pressable key={g} style={[styles.radioBtn, form.gender === g && styles.radioBtnActive]} onPress={() => set('gender')(g)}>
                                    <Text style={[styles.radioTxt, form.gender === g && { color: CLR.primary }]}>{g.charAt(0).toUpperCase() + g.slice(1)}</Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>
                </View>

                <View style={styles.divider} />

                <Text style={styles.formSectionTitle}>Clinical Case Details</Text>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Chief Complaint *</Text>
                    <TextInput style={styles.input} value={form.chiefComplaint} onChangeText={set('chiefComplaint')} placeholder="Primary health issue..." />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Symptoms (comma separated)</Text>
                    <TextInput style={styles.input} value={form.symptoms} onChangeText={set('symptoms')} placeholder="Fever, cough, body pain..." />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Severity</Text>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        {['low', 'medium', 'high', 'critical'].map(s => (
                            <Pressable key={s} style={[styles.radioBtn, form.severity === s && styles.radioBtnActive]} onPress={() => set('severity')(s)}>
                                <Text style={[styles.radioTxt, form.severity === s && { color: PRI_MAP[s]?.txt || CLR.primary }]}>{s.charAt(0).toUpperCase() + s.slice(1)}</Text>
                            </Pressable>
                        ))}
                    </View>
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Triage Notes</Text>
                    <TextInput multiline numberOfLines={4} style={[styles.input, { height: 100, textAlignVertical: 'top' }]} value={form.notes} onChangeText={set('notes')} placeholder="Any additional triage observations..." />
                </View>

                <Btn style={styles.submitBtn} onPress={submit} disabled={submitting}>
                    {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnTxt}>Create Draft Case</Text>}
                </Btn>
            </View>
        </ScrollView>
    );
}

function DoctorCard({ doc, loading, onSelect, isSenior }) {
    return (
        <View style={styles.doctorCard}>
            <AvatarCircle name={doc.name} size={48} style={{ marginBottom: 12 }} />
            <Text style={styles.docName} numberOfLines={1}>Dr. {doc.name}</Text>
            <Text style={styles.docRole}>{isSenior ? 'Senior Specialist' : 'Junior Doctor'}</Text>
            <View style={styles.docBadge}>
                <Text style={styles.docBadgeTxt}>{doc.qualification || 'MBBS'}</Text>
            </View>
            <Btn style={styles.docAssignBtn} onPress={onSelect} disabled={loading}>
                <Text style={styles.docAssignBtnTxt}>Assign</Text>
            </Btn>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, flexDirection: 'row', backgroundColor: CLR.bg },
    sidebar: { width: 280, backgroundColor: CLR.sidebarBg, padding: 24, justifyContent: 'space-between', display: WEB ? 'flex' : 'none' },

    sidebarHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 40 },
    logoCircle: { width: 44, height: 44, borderRadius: 14, backgroundColor: CLR.primary, alignItems: 'center', justifyContent: 'center', ...SHADOW.md },
    logoName: { color: '#F1F5F9', fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
    logoTag: { color: CLR.sidebarText, fontSize: 10, fontWeight: '700', letterSpacing: 1 },

    sidebarContent: { flex: 1 },
    sidebarHeading: { color: '#64748B', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 16, marginTop: 16 },
    navItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 16, borderRadius: 12, gap: 12, marginBottom: 4 },
    navItemActive: { backgroundColor: CLR.sidebarActive },
    navLabel: { color: CLR.sidebarText, fontSize: 14, fontWeight: '600' },
    navLabelActive: { color: CLR.sidebarTextActive },

    sidebarFooter: { marginTop: 'auto', gap: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)', paddingTop: 16 },
    userCard: { flexDirection: 'row', alignItems: 'center', padding: 10, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, gap: 12 },
    userAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: CLR.primary, alignItems: 'center', justifyContent: 'center' },
    userInitials: { color: '#fff', fontSize: 14, fontWeight: '700' },
    userNameSide: { color: '#F1F5F9', fontSize: 13, fontWeight: '700' },
    userRoleSide: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '600' },
    signOutBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, gap: 10, borderRadius: 10 },
    signOutTxt: { color: '#F87171', fontSize: 13, fontWeight: '600' },

    main: { flex: 1, flexDirection: 'column' },
    topHeader: { height: 72, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: CLR.surface, borderBottomWidth: 1, borderColor: CLR.border },

    panelContainer: { flex: 1, padding: 24 },
    tableToolbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    tableSearch: { flexDirection: 'row', alignItems: 'center', backgroundColor: CLR.surface, borderWidth: 1, borderColor: CLR.border, borderRadius: 8, paddingHorizontal: 12, height: 40, width: 300 },
    tableSearchInput: { flex: 1, fontSize: 14, color: CLR.textPri },
    assignSelectedBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: CLR.primary, paddingHorizontal: 16, height: 40, borderRadius: 8 },

    tableWrapper: { flex: 1, backgroundColor: CLR.surface, borderRadius: 12, borderWidth: 1, borderColor: CLR.border, overflow: 'hidden' },
    tableHeader: { flexDirection: 'row', backgroundColor: '#F8FAFC', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderColor: CLR.border },
    colHeader: { fontSize: 12, fontWeight: '700', color: CLR.textSec, textTransform: 'uppercase', letterSpacing: 0.5 },
    tr: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderColor: CLR.border },
    tdText: { fontSize: 14, color: CLR.textPri },
    emptyTxt: { textAlign: 'center', padding: 40, color: CLR.textSec, fontStyle: 'italic' },

    formContainer: { flex: 1 },
    formCard: { backgroundColor: CLR.surface, padding: 24, borderRadius: 12, borderWidth: 1, borderColor: CLR.border, maxWidth: 800, alignSelf: 'center', width: '100%' },
    formSectionTitle: { fontSize: 18, fontWeight: '700', color: CLR.textPri, marginBottom: 16 },
    divider: { height: 1, backgroundColor: CLR.border, marginVertical: 24 },
    formGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
    formGroup: { flex: 1, minWidth: '45%', marginBottom: 16 },
    label: { fontSize: 13, fontWeight: '600', color: CLR.textSec, marginBottom: 8 },
    input: { backgroundColor: CLR.bg, borderWidth: 1, borderColor: CLR.border, borderRadius: 8, paddingHorizontal: 12, height: 44, fontSize: 14, color: CLR.textPri, ...NO_OUTLINE },
    radioBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', height: 44, borderWidth: 1, borderColor: CLR.border, borderRadius: 8, backgroundColor: CLR.bg },
    radioBtnActive: { borderColor: CLR.primary, backgroundColor: CLR.primarySoft },
    radioTxt: { fontSize: 13, fontWeight: '600', color: CLR.textSec, textTransform: 'capitalize' },
    submitBtn: { backgroundColor: CLR.primary, height: 48, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
    submitBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },

    modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(5, 10, 25, 0.7)', justifyContent: 'center', alignItems: 'center', zIndex: 999, ...(WEB ? { backdropFilter: 'blur(10px)' } : {}) },
    modalContent: { width: '90%', maxWidth: 800, backgroundColor: CLR.bg, borderRadius: 16, maxHeight: '80%', overflow: 'hidden', borderWidth: 1, borderColor: CLR.border, ...(WEB ? { boxShadow: '0 20px 40px rgba(0,0,0,0.5)' } : { elevation: 15 }) },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderColor: CLR.border, backgroundColor: CLR.surface },
    modalTitle: { fontSize: 18, fontWeight: '700', color: CLR.textPri },
    modalBody: { padding: 24 },
    modalSectionTitle: { fontSize: 14, fontWeight: '700', color: CLR.primary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 },
    doctorHList: { gap: 16, paddingBottom: 16 },
    doctorCard: { width: 180, backgroundColor: CLR.bg, borderWidth: 1, borderColor: CLR.border, borderRadius: 12, padding: 16, alignItems: 'center' },
    docName: { fontSize: 14, fontWeight: '700', color: CLR.textPri, marginBottom: 4 },
    docRole: { fontSize: 12, color: CLR.textSec, marginBottom: 12 },
    docBadge: { backgroundColor: CLR.primarySoft, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, marginBottom: 16 },
    docBadgeTxt: { fontSize: 11, fontWeight: '600', color: CLR.primary },
    docAssignBtn: { width: '100%', backgroundColor: CLR.primary, paddingVertical: 8, borderRadius: 6, alignItems: 'center' },
    docAssignBtnTxt: { color: '#fff', fontSize: 13, fontWeight: '600' }
});

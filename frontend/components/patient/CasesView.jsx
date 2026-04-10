import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Platform, RefreshControl } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { CLR, TY, SP, SHADOW } from '../../constants/DesignTokens';
import GlassCard from '../ui/GlassCard';
import Toast from 'react-native-toast-message';

const CasesView = ({ cases, loading, refreshing, onRefresh, onSelectCase }) => {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [severityFilter, setSeverityFilter] = useState('ALL');
    const [sortOrder, setSortOrder] = useState('newest'); // 'newest' | 'oldest'

    const filteredCases = useMemo(() => {
        let result = [...cases];

        // Search
        if (search) {
            const q = search.toLowerCase();
            result = result.filter(c =>
                c.chiefComplaint?.toLowerCase().includes(q) ||
                c.caseId?.toLowerCase().includes(q)
            );
        }

        // Status filter
        if (statusFilter !== 'ALL') {
            result = result.filter(c => c.status === statusFilter);
        }

        // Severity filter
        if (severityFilter !== 'ALL') {
            result = result.filter(c => c.severity === severityFilter.toLowerCase());
        }

        // Sort
        result.sort((a, b) => {
            const dateA = new Date(a.createdAt);
            const dateB = new Date(b.createdAt);
            return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
        });

        return result;
    }, [cases, search, statusFilter, severityFilter, sortOrder]);

    const exportToCSV = () => {
        const headers = ['Case ID', 'Date', 'Complaint', 'Severity', 'Status'];
        const data = filteredCases.map(c => [
            c.caseId || 'N/A',
            new Date(c.createdAt).toLocaleDateString(),
            c.chiefComplaint.replace(/,/g, ' '),
            c.severity,
            c.status
        ]);

        const csvContent = [headers, ...data].map(row => row.join(',')).join('\n');

        if (Platform.OS === 'web') {
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `medical_cases_${new Date().getTime()}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            Toast.show({ type: 'success', text1: 'Exported!', text2: 'CSV file downloaded.' });
        } else {
            Toast.show({ type: 'info', text1: 'Export', text2: 'CSV export is available on Web.' });
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={TY.h1}>Medical Records</Text>
                    <Text style={TY.bodyMuted}>Track and manage your history</Text>
                </View>
                <TouchableOpacity style={styles.exportBtn} onPress={exportToCSV}>
                    <Feather name="download" size={16} color={CLR.primary} />
                    <Text style={styles.exportText}>Export CSV</Text>
                </TouchableOpacity>
            </View>

            {/* Toolbar */}
            <GlassCard style={styles.toolbar} intensity={0.5}>
                <View style={styles.searchBox}>
                    <Feather name="search" size={16} color={CLR.textMuted} />
                    <TextInput
                        style={styles.input}
                        placeholder="Search cases..."
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                    <FilterChip label="All" active={statusFilter === 'ALL'} onPress={() => setStatusFilter('ALL')} />
                    <FilterChip label="New" active={statusFilter === 'NEW'} onPress={() => setStatusFilter('NEW')} />
                    <FilterChip label="Assigned" active={statusFilter === 'ASSIGNED'} onPress={() => setStatusFilter('ASSIGNED')} />
                    <FilterChip label="Diagnosed" active={statusFilter === 'DIAGNOSED'} onPress={() => setStatusFilter('DIAGNOSED')} />
                    <FilterChip label="Critical" active={severityFilter === 'CRITICAL'} onPress={() => setSeverityFilter(severityFilter === 'CRITICAL' ? 'ALL' : 'CRITICAL')} color={CLR.danger} />
                </ScrollView>
            </GlassCard>

            <ScrollView
                style={{ flex: 1 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[CLR.primary]} />}
            >
                {filteredCases.length === 0 ? (
                    <View style={styles.empty}>
                        <Feather name="search" size={48} color={CLR.border} />
                        <Text style={[TY.h3, { marginTop: 16 }]}>No matching records</Text>
                        <Text style={TY.bodyMuted}>Try adjusting your filters or search terms</Text>
                    </View>
                ) : (
                    <View style={styles.list}>
                        <View style={styles.listHeader}>
                            <Text style={[styles.col, { flex: 1 }]}>Case ID</Text>
                            <Text style={[styles.col, { flex: 2 }]}>Complaint</Text>
                            <Text style={[styles.col, { flex: 1 }]}>Severity</Text>
                            <Text style={[styles.col, { flex: 1 }]}>Status</Text>
                            <TouchableOpacity onPress={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')} style={styles.sortBtn}>
                                <Feather name={sortOrder === 'newest' ? 'arrow-down' : 'arrow-up'} size={14} color={CLR.primary} />
                            </TouchableOpacity>
                        </View>
                        {filteredCases.map(c => (
                            <TouchableOpacity key={c._id} style={styles.row} onPress={() => onSelectCase(c)}>
                                <Text style={[TY.bodySemi, { flex: 1, color: CLR.primary }]}>#{c.caseId || '---'}</Text>
                                <Text style={[TY.body, { flex: 2 }]} numberOfLines={1}>{c.chiefComplaint}</Text>
                                <View style={{ flex: 1 }}>
                                    <View style={[styles.badge, { backgroundColor: CLR.status[c.severity?.toUpperCase()]?.bg || CLR.bg }]}>
                                        <Text style={[styles.badgeText, { color: CLR.status[c.severity?.toUpperCase()]?.txt || CLR.textSec }]}>{c.severity}</Text>
                                    </View>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <View style={[styles.badge, { backgroundColor: CLR.status[c.status]?.bg }]}>
                                        <Text style={[styles.badgeText, { color: CLR.status[c.status]?.txt }]}>{c.status}</Text>
                                    </View>
                                </View>
                                <Feather name="chevron-right" size={16} color={CLR.border} />
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

const FilterChip = ({ label, active, onPress, color = CLR.primary }) => (
    <TouchableOpacity
        onPress={onPress}
        style={[
            styles.chip,
            active && { backgroundColor: color, borderColor: color }
        ]}
    >
        <Text style={[
            styles.chipText,
            active && { color: '#fff' }
        ]}>{label}</Text>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SP.xl,
    },
    exportBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: CLR.primary + '10',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
    },
    exportText: {
        color: CLR.primary,
        fontWeight: '700',
        fontSize: 13,
        marginLeft: 8,
    },
    toolbar: {
        margin: SP.xl,
        marginTop: 0,
        padding: 16,
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 48,
        borderWidth: 1,
        borderColor: CLR.border,
        marginBottom: 12,
    },
    input: {
        flex: 1,
        marginLeft: 8,
        fontSize: 15,
    },
    filterRow: {
        gap: 8,
        paddingRight: 10,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: CLR.border,
    },
    chipText: {
        fontSize: 13,
        fontWeight: '600',
        color: CLR.textSec,
    },
    list: {
        backgroundColor: '#fff',
        marginHorizontal: SP.xl,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: CLR.border,
    },
    listHeader: {
        flexDirection: 'row',
        backgroundColor: CLR.bg,
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: CLR.border,
    },
    col: {
        fontSize: 11,
        fontWeight: '700',
        color: CLR.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: CLR.borderLight,
    },
    badge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    sortBtn: {
        padding: 4,
    },
    empty: {
        padding: 60,
        alignItems: 'center',
    }
});

export default CasesView;

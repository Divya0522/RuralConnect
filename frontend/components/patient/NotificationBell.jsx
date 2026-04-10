import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Modal, Pressable, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { CLR, TY, SP, SHADOW } from '../../constants/DesignTokens';
import { notificationService } from '../../services/api';

const NotificationBell = ({ onSelectCase }) => {
    const [notifications, setNotifications] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [hovering, setHovering] = useState(false);

    const fetchNotifications = async (showLoading = false) => {
        if (showLoading) setLoading(true);
        try {
            const r = await notificationService.list({ limit: 30 });
            const data = r.data.data || [];
            setNotifications(data);
            setUnreadCount(r.data.unread || 0);
        } catch (e) {
            console.error('Failed to fetch notifications', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 25000); // 25s poll
        return () => clearInterval(interval);
    }, []);

    const handleMarkAllRead = async () => {
        try {
            await notificationService.markAllRead();
            fetchNotifications();
        } catch (e) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to mark all as read.' });
        }
    };

    const handleItemPress = async (item) => {
        try {
            if (!item.isRead) {
                await notificationService.markRead(item._id);
                fetchNotifications();
            }
            setShowDropdown(false);
            if (item.relatedCase && onSelectCase) {
                onSelectCase(item.relatedCase);
            }
        } catch (e) {
            console.error('Notification action error:', e);
        }
    };

    const getRelativeTime = (date) => {
        const now = new Date();
        const past = new Date(date);
        const diffMs = now - past;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${diffDays}d ago`;
    };

    return (
        <View
            style={styles.container}
            {...(Platform.OS === 'web' ? {
                onPointerEnter: () => { setHovering(true); setShowDropdown(true); },
                onPointerLeave: () => { setHovering(false); setShowDropdown(false); }
            } : {})}
        >
            <TouchableOpacity
                style={[styles.bellBtn, (showDropdown || hovering) && styles.bellBtnActive]}
                onPress={() => setShowDropdown(!showDropdown)}
            >
                <Feather name="bell" size={22} color={(showDropdown || hovering) ? CLR.primary : CLR.textPri} />
                {unreadCount > 0 && (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                    </View>
                )}
            </TouchableOpacity>

            {showDropdown && (
                <View style={[styles.ddWrapper, SHADOW.lg]}>
                    {Platform.OS !== 'web' && <Pressable style={styles.overlay} onPress={() => setShowDropdown(false)} />}
                    <View style={styles.dropdown}>
                        <View style={styles.ddHeader}>
                            <View style={styles.ddHeaderTop}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.ddTitle}>Notifications</Text>
                                    <Text style={styles.ddSubitle}>{unreadCount} unread messages</Text>
                                </View>
                                <View style={styles.ddActions}>
                                    <TouchableOpacity onPress={() => fetchNotifications(true)} disabled={loading} style={styles.refreshBtn}>
                                        <Feather name="refresh-cw" size={14} color={CLR.textSec} style={loading && { opacity: 0.5 }} />
                                    </TouchableOpacity>
                                    {unreadCount > 0 && (
                                        <TouchableOpacity onPress={handleMarkAllRead} style={styles.markAllBtn}>
                                            <Text style={styles.markAllTxt}>Mark all read</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        </View>

                        {notifications.length === 0 ? (
                            <View style={styles.empty}>
                                <Feather name="bell-off" size={32} color={CLR.textMuted} />
                                <Text style={[TY.bodyMuted, { marginTop: 12 }]}>All caught up!</Text>
                            </View>
                        ) : (
                            <FlatList
                                data={notifications}
                                keyExtractor={item => item._id}
                                renderItem={({ item }) => {
                                    const displayTitle = item.title.replace(/^\[.*?\]\s*/, '');
                                    const roleTag = item.title.match(/^\[(.*?)\]/)?.[1] || item.targetRole?.toUpperCase();

                                    return (
                                        <TouchableOpacity
                                            style={[styles.item, !item.isRead && styles.unreadItem]}
                                            onPress={() => handleItemPress(item)}
                                        >
                                            <View style={[styles.itemIcon, item.type === 'alert' && { backgroundColor: CLR.dangerSoft }]}>
                                                <Feather
                                                    name={item.type === 'alert' ? 'alert-octagon' : (item.type === 'case_assigned' ? 'briefcase' : 'info')}
                                                    size={16}
                                                    color={item.type === 'alert' ? CLR.danger : CLR.primary}
                                                />
                                            </View>
                                            <View style={styles.itemContent}>
                                                <View style={styles.itemTopRow}>
                                                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                        <Text style={[styles.itemTitle, !item.isRead && { fontWeight: '700' }]} numberOfLines={1}>
                                                            {displayTitle}
                                                        </Text>
                                                        {roleTag && (
                                                            <View style={[styles.roleBadge, { backgroundColor: roleTag === 'STAFF' || roleTag === 'MEDICAL ALERT' ? '#EEF2FF' : '#F0FDF4' }]}>
                                                                <Text style={[styles.roleBadgeTxt, { color: roleTag === 'STAFF' || roleTag === 'MEDICAL ALERT' ? '#4F46E5' : '#16A34A' }]}>{roleTag}</Text>
                                                            </View>
                                                        )}
                                                    </View>
                                                    <Text style={styles.itemTime}>{getRelativeTime(item.createdAt)}</Text>
                                                </View>
                                                <Text style={styles.itemMsg} numberOfLines={2}>{item.message}</Text>
                                            </View>
                                            {!item.isRead && <View style={styles.unreadDot} />}
                                        </TouchableOpacity>
                                    );
                                }}
                                scrollEnabled={true}
                                style={{ maxHeight: 400 }}
                                contentContainerStyle={{ paddingBottom: 10 }}
                            />
                        )}
                    </View>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { zIndex: 9999, position: 'relative' },
    bellBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: CLR.border,
    },
    bellBtnActive: { backgroundColor: CLR.primarySoft, borderColor: CLR.primary },
    badge: {
        position: 'absolute',
        top: -2,
        right: -2,
        backgroundColor: CLR.danger,
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#fff',
        zIndex: 10,
    },
    badgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
    ddWrapper: {
        position: 'absolute',
        top: 56,
        right: -4,
        width: 380,
        backgroundColor: '#fff',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: CLR.border,
        ...SHADOW.lg,
        elevation: 10,
    },
    overlay: { position: 'absolute', top: -1000, left: -1000, width: 3000, height: 3000 },
    dropdown: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 20,
        overflow: 'hidden',
    },
    ddHeader: {
        paddingVertical: 18,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        backgroundColor: '#fff',
    },
    ddHeaderTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    ddTitle: { fontSize: 16, fontWeight: '700', color: CLR.textPri },
    ddSubitle: { fontSize: 12, color: CLR.textSec, marginTop: 1 },
    ddActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    refreshBtn: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#F8FAFC',
        alignItems: 'center',
        justifyContent: 'center'
    },
    markAllBtn: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: CLR.primarySoft,
        borderRadius: 8,
    },
    markAllTxt: { fontSize: 12, fontWeight: '700', color: CLR.primary },
    item: {
        flexDirection: 'row',
        padding: 16,
        paddingRight: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F8FAFC',
        alignItems: 'center',
    },
    unreadItem: { backgroundColor: '#F0F9FF' },
    itemIcon: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: CLR.primarySoft,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    itemContent: { flex: 1 },
    itemTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
    itemTitle: { fontSize: 14, color: CLR.textPri, flex: 1, marginRight: 8 },
    itemTime: { fontSize: 11, color: CLR.textSec },
    itemMsg: { fontSize: 13, color: CLR.textSec, lineHeight: 18 },
    unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: CLR.primary, marginLeft: 8 },
    roleBadge: {
        paddingVertical: 2,
        paddingHorizontal: 6,
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    roleBadgeTxt: {
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    empty: { padding: 56, alignItems: 'center' },
});

export default NotificationBell;

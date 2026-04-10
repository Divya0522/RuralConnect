import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { CLR, TY, SP, SHADOW } from '../../constants/DesignTokens';

const EmergencyButton = ({ onConfirm }) => {
    const [visible, setVisible] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        setLoading(true);
        await onConfirm();
        setLoading(false);
        setVisible(false);
    };

    return (
        <>
            <TouchableOpacity
                style={[styles.btn, SHADOW.md]}
                onPress={() => setVisible(true)}
            >
                <Feather name="alert-octagon" size={24} color="#fff" />
                <Text style={styles.btnText}>Emergency</Text>
            </TouchableOpacity>

            <Modal
                transparent
                visible={visible}
                animationType="fade"
                onRequestClose={() => setVisible(false)}
            >
                <View style={styles.overlay}>
                    <View style={[styles.modal, SHADOW.lg]}>
                        <View style={styles.iconCircle}>
                            <Feather name="alert-triangle" size={32} color={CLR.danger} />
                        </View>
                        <Text style={TY.h2}>Emergency Alert?</Text>
                        <Text style={[TY.bodyMuted, { textAlign: 'center', marginTop: 8 }]}>
                            This will create a high-priority complaint and notify the duty doctor immediately. Only use this for critical health emergencies.
                        </Text>

                        <View style={styles.actions}>
                            <TouchableOpacity
                                style={styles.cancelBtn}
                                onPress={() => setVisible(false)}
                            >
                                <Text style={TY.bodySemi}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.confirmBtn}
                                onPress={handleConfirm}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={[TY.bodySemi, { color: '#fff' }]}>Confirm Emergency</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    btn: {
        backgroundColor: CLR.danger,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 99,
        gap: 10,
    },
    btnText: {
        color: '#fff',
        fontWeight: '800',
        fontSize: 15,
        letterSpacing: 0.5,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modal: {
        backgroundColor: '#fff',
        padding: 32,
        borderRadius: 24,
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: CLR.danger + '10',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 32,
        width: '100%',
    },
    cancelBtn: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        backgroundColor: CLR.bg,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: CLR.border,
    },
    confirmBtn: {
        flex: 2,
        height: 48,
        borderRadius: 12,
        backgroundColor: CLR.danger,
        alignItems: 'center',
        justifyContent: 'center',
    }
});

export default EmergencyButton;

import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TextInput,
    TouchableOpacity, ActivityIndicator, Platform, Image
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { CLR, TY, SP, SHADOW } from '../../constants/DesignTokens';
import { villageService, patientService, caseService } from '../../services/api';

import GlassCard from '../ui/GlassCard';
import Toast from 'react-native-toast-message';

// ─── Field-level inline error message ─────────────────────────────────────────
const FieldError = ({ msg }) =>
    msg ? <Text style={styles.fieldError}>{msg}</Text> : null;

// ─── Required label ────────────────────────────────────────────────────────────
const Label = ({ text, required }) => (
    <Text style={styles.label}>
        {text}
        {required && <Text style={{ color: CLR.danger }}> *</Text>}
    </Text>
);

// ─── Section header ────────────────────────────────────────────────────────────
const SectionHeader = ({ icon, title, subtitle }) => (
    <View style={styles.sectionHeader}>
        <View style={styles.sectionIconWrap}>
            <Feather name={icon} size={16} color={CLR.primary} />
        </View>
        <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
        </View>
    </View>
);

// ─── Option Chip selector ──────────────────────────────────────────────────────
const OptionChips = ({ label, required, options, value, onChange, error }) => (
    <View style={styles.field}>
        <Label text={label} required={required} />
        <View style={styles.chipWrap}>
            {options.map(opt => (
                <TouchableOpacity
                    key={opt.value}
                    style={[styles.chip, value === opt.value && styles.chipActive]}
                    onPress={() => onChange(opt.value)}
                    activeOpacity={0.75}
                >
                    {opt.icon && (
                        <Feather
                            name={opt.icon}
                            size={13}
                            color={value === opt.value ? '#fff' : CLR.textSec}
                            style={{ marginRight: 5 }}
                        />
                    )}
                    <Text style={[styles.chipText, value === opt.value && styles.chipTextActive]}>
                        {opt.label}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
        <FieldError msg={error} />
    </View>
);

// ─── InputField Template ──────────────────────────────────────────────────────
const InputField = ({ label, icon, value, onChange, placeholder, required, error, keyboardType, maxLength }) => (
    <View style={styles.field}>
        <Label text={label} required={required} />
        <View style={[styles.inputWithIcon, error && styles.inputError]}>
            <Feather name={icon} size={15} color={CLR.textMuted} style={styles.inputIcon} />
            <TextInput
                style={[styles.input, styles.inputIconPadding]}
                placeholder={placeholder}
                placeholderTextColor={CLR.textMuted}
                value={value}
                onChangeText={onChange}
                keyboardType={keyboardType || 'default'}
                maxLength={maxLength}
            />
        </View>
        <FieldError msg={error} />
    </View>
);

// ─── Image Upload Area ─────────────────────────────────────────────────────────
const ImageUploadArea = ({ images, onAdd, onRemove }) => {
    const inputRef = useRef(null);

    const handleWebPick = (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        const remaining = 4 - images.length;
        files.slice(0, remaining).forEach(file => {
            const uri = URL.createObjectURL(file);
            onAdd({ uri, file, name: file.name, type: file.type });
        });
        // reset input so same file can be re‑added
        if (inputRef.current) inputRef.current.value = '';
    };

    const canAdd = images.length < 4;

    return (
        <View style={styles.imageSection}>
            <View style={styles.imageGrid}>
                {images.map((img, idx) => (
                    <View key={idx} style={styles.imageThumbWrap}>
                        <Image source={{ uri: img.uri }} style={styles.imageThumb} resizeMode="cover" />
                        <TouchableOpacity
                            style={styles.imageRemoveBtn}
                            onPress={() => onRemove(idx)}
                            hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
                        >
                            <Feather name="x" size={12} color="#fff" />
                        </TouchableOpacity>
                    </View>
                ))}

                {canAdd && (
                    <TouchableOpacity
                        style={styles.imageAddBtn}
                        onPress={() => {
                            if (Platform.OS === 'web') {
                                inputRef.current?.click();
                            }
                        }}
                        activeOpacity={0.75}
                    >
                        <Feather name="camera" size={22} color={CLR.primary} />
                        <Text style={styles.imageAddText}>
                            {images.length === 0 ? 'Add Photo' : 'Add More'}
                        </Text>
                        <Text style={styles.imageAddSub}>
                            {4 - images.length} remaining
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            {Platform.OS === 'web' && (
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    style={{ display: 'none' }}
                    onChange={handleWebPick}
                />
            )}

            <Text style={styles.imageHint}>
                <Feather name="info" size={11} color={CLR.textMuted} /> Optional — attach photos of visible symptoms, rashes, wounds, or prescriptions (max 4)
            </Text>
        </View>
    );
};

// ─── Severity Step ─────────────────────────────────────────────────────────────
const SEVERITY_OPTIONS = [
    { value: 'low', label: 'Mild', icon: 'smile', color: CLR.success },
    { value: 'medium', label: 'Moderate', icon: 'meh', color: CLR.warning },
    { value: 'high', label: 'Severe', icon: 'frown', color: '#F97316' },
    { value: 'critical', label: 'Critical', icon: 'alert-triangle', color: CLR.danger },
];

const SeveritySelector = ({ value, onChange }) => (
    <View style={styles.severityRow}>
        {SEVERITY_OPTIONS.map(opt => {
            const active = value === opt.value;
            return (
                <TouchableOpacity
                    key={opt.value}
                    style={[styles.severityCard, active && { borderColor: opt.color, backgroundColor: opt.color + '12' }]}
                    onPress={() => onChange(opt.value)}
                    activeOpacity={0.75}
                >
                    <Feather name={opt.icon} size={20} color={active ? opt.color : CLR.textMuted} />
                    <Text style={[styles.severityLabel, active && { color: opt.color, fontWeight: '700' }]}>
                        {opt.label}
                    </Text>
                </TouchableOpacity>
            );
        })}
    </View>
);

// ─── Location option data ──────────────────────────────────────────────────────

// ─── Main Component ────────────────────────────────────────────────────────────
const ComplaintView = ({ user, onSuccess }) => {
    const [villages, setVillages] = useState([]);
    const [loadingV, setLoadingV] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [images, setImages] = useState([]);

    const [form, setForm] = useState({
        complaint: '',
        symptoms: '',
        severity: 'medium',
        village: '',
        pincode: '',
        district: '',
        state: '',
    });

    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});

    useEffect(() => {
        villageService.list({ limit: 200 })
            .then(r => setVillages(r.data.data || []))
            .catch(() => { })
            .finally(() => setLoadingV(false));
    }, []);

    useEffect(() => {
        if (form.pincode.length === 6) {
            const match = villages.find(v =>
                v.pincode === form.pincode || v.pinCode === form.pincode
            );
            if (match) {
                setForm(f => ({ ...f, village: match.name }));
                Toast.show({ type: 'success', text1: 'Village found', text2: `Auto-filled: ${match.name}` });
                setErrors(e => ({ ...e, village: null }));
            }
        }
    }, [form.pincode, villages]);

    const touch = (field) => setTouched(t => ({ ...t, [field]: true }));

    const validate = () => {
        const e = {};
        if (!form.complaint.trim()) e.complaint = 'Please describe your main health concern.';
        if (!form.village) e.village = 'Please select your village.';
        return e;
    };

    const addImage = (img) => setImages(prev => [...prev, img]);
    const removeImage = (idx) => setImages(prev => prev.filter((_, i) => i !== idx));

    const submit = async () => {
        setTouched({ complaint: true, village: true });
        const e = validate();
        if (Object.keys(e).length > 0) {
            setErrors(e);
            Toast.show({ type: 'error', text1: 'Missing Fields', text2: 'Please fill in all required fields.' });
            return;
        }
        setErrors({});
        setSubmitting(true);
        try {
            let pid;
            const meRes = await patientService.me().catch(() => null);
            pid = meRes?.data?.data?._id;

            if (!pid) {
                const pRes = await patientService.create({
                    name: user.name,
                    phone: user.phone || '9999999999',
                    villageName: form.village || undefined,
                    state: form.state || undefined,
                    district: form.district || undefined,
                    pincode: form.pincode || undefined,
                });
                pid = pRes.data.data._id;
            }

            const fd = new FormData();
            fd.append('patient', pid);
            fd.append('chiefComplaint', form.complaint);
            fd.append('severity', form.severity);
            if (form.village) fd.append('villageName', form.village);
            if (form.pincode) fd.append('pincode', form.pincode);
            if (form.district) fd.append('district', form.district);
            if (form.state) fd.append('state', form.state);

            if (form.symptoms) {
                form.symptoms.split(',').map(s => s.trim()).filter(Boolean).forEach(s => {
                    fd.append('symptoms', s);
                });
            }

            images.forEach((img, i) => {
                if (img.file) {
                    fd.append('images', img.file, img.name || `image_${i}.jpg`);
                }
            });

            await caseService.create(fd);
            Toast.show({
                type: 'success',
                text1: 'Complaint Submitted',
                text2: 'A doctor will review your case shortly.'
            });
            onSuccess();
        } catch (e) {
            Toast.show({
                type: 'error',
                text1: 'Submission Failed',
                text2: e.response?.data?.error || 'Unknown error. Please try again.'
            });
        } finally {
            setSubmitting(false);
        }
    };

    const isSubmitDisabled = submitting || !form.complaint.trim();

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
        >
            {/* ── Page Header ─────────────────────────────────────── */}
            <View style={styles.pageHeader}>
                <View style={styles.pageHeaderIcon}>
                    <Feather name="clipboard" size={22} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.pageTitle}>New Complaint</Text>
                    <Text style={styles.pageSubtitle}>Describe your symptoms for a specialist review</Text>
                </View>
            </View>

            <View style={styles.form}>

                {/* ── Card 1: Health Concern ───────────────────────── */}
                <GlassCard style={styles.card}>
                    <SectionHeader
                        icon="activity"
                        title="Health Concern"
                        subtitle="Describe what you are experiencing"
                    />

                    {/* Chief Complaint */}
                    <View style={styles.field}>
                        <Label text="What is your main health concern?" required />
                        <TextInput
                            style={[
                                styles.textarea,
                                (touched.complaint && errors.complaint) && styles.inputError
                            ]}
                            placeholder="e.g. Severe stomach pain since last night, worsens after eating..."
                            placeholderTextColor={CLR.textMuted}
                            multiline
                            value={form.complaint}
                            onChangeText={v => {
                                setForm({ ...form, complaint: v });
                                if (touched.complaint && v.trim()) setErrors(e => ({ ...e, complaint: null }));
                            }}
                            onBlur={() => touch('complaint')}
                            accessibilityLabel="Describe your main health complaint"
                        />
                        <FieldError msg={touched.complaint && errors.complaint} />
                    </View>

                    {/* Severity */}
                    <View style={styles.field}>
                        <Label text="How severe is it?" required />
                        <SeveritySelector
                            value={form.severity}
                            onChange={v => setForm({ ...form, severity: v })}
                        />
                    </View>

                    {/* Symptoms */}
                    <View style={[styles.field, { marginBottom: 0 }]}>
                        <Label text="Symptoms" />
                        <Text style={styles.hint}>List your symptoms, separated by commas — e.g. fever, headache, nausea</Text>
                        <TextInput
                            style={styles.symptomsInput}
                            placeholder="e.g. fever, headache, fatigue, vomiting..."
                            placeholderTextColor={CLR.textMuted}
                            multiline
                            value={form.symptoms}
                            onChangeText={v => setForm({ ...form, symptoms: v })}
                            accessibilityLabel="List your symptoms"
                        />
                    </View>
                </GlassCard>

                {/* ── Card 2: Supporting Photos ────────────────────── */}
                <GlassCard style={styles.card}>
                    <SectionHeader
                        icon="camera"
                        title="Supporting Photos"
                        subtitle="Optional — helps doctors assess your condition faster"
                    />
                    <ImageUploadArea
                        images={images}
                        onAdd={addImage}
                        onRemove={removeImage}
                    />
                </GlassCard>

                {/* ── Card 3: Location ─────────────────────────────── */}
                <GlassCard style={styles.card}>
                    <SectionHeader
                        icon="map-pin"
                        title="Your Location"
                        subtitle="Helps connect you with nearby doctors"
                    />

                    {/* Village */}
                    <InputField
                        label="Village"
                        icon="map-pin"
                        value={form.village}
                        onChange={v => {
                            setForm({ ...form, village: v });
                            if (touched.village && v.trim()) setErrors(e => ({ ...e, village: null }));
                        }}
                        placeholder="e.g. Rampur"
                        required
                        error={touched.village && errors.village}
                    />

                    {/* Pincode */}
                    <InputField
                        label="Pincode"
                        icon="hash"
                        value={form.pincode}
                        onChange={v => {
                            if (/^\d{0,6}$/.test(v)) setForm({ ...form, pincode: v });
                        }}
                        placeholder="e.g. 500001"
                        keyboardType="numeric"
                        maxLength={6}
                    />

                    {/* State */}
                    <InputField
                        label="State"
                        icon="map"
                        value={form.state}
                        onChange={v => setForm({ ...form, state: v })}
                        placeholder="e.g. Telangana"
                    />

                    {/* District */}
                    <InputField
                        label="District"
                        icon="navigation"
                        value={form.district}
                        onChange={v => setForm({ ...form, district: v })}
                        placeholder="e.g. Hyderabad"
                    />
                </GlassCard>

                {/* ── Submit Button ─────────────────────────────────── */}
                <View style={styles.submitWrap}>
                    <TouchableOpacity
                        style={[
                            styles.submitBtn,
                            SHADOW.md,
                            isSubmitDisabled && styles.submitBtnDisabled
                        ]}
                        onPress={submit}
                        disabled={isSubmitDisabled}
                        accessibilityRole="button"
                        accessibilityLabel="Submit complaint"
                    >
                        {submitting ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Feather name="send" size={18} color="#fff" style={{ marginRight: 10 }} />
                                <Text style={styles.submitText}>Submit Complaint</Text>
                            </>
                        )}
                    </TouchableOpacity>
                    {isSubmitDisabled && !submitting && (
                        <Text style={[styles.hint, { textAlign: 'center', marginTop: 8 }]}>
                            Please describe your concern to continue
                        </Text>
                    )}
                </View>

                {/* ── Emergency Tip ─────────────────────────────────── */}
                <View style={styles.emergencyTip}>
                    <View style={styles.tipIcon}>
                        <Feather name="alert-triangle" size={18} color={CLR.danger} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={[TY.bodySemi, { color: CLR.danger }]}>Is this an emergency?</Text>
                        <Text style={[TY.small, { color: CLR.textSec, marginTop: 2 }]}>
                            Use the red Emergency button at the top of the screen to activate High Priority Mode immediately.
                        </Text>
                    </View>
                </View>

            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: SP.xl, paddingBottom: 60 },

    // ── Page Header
    pageHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        marginBottom: SP.xl,
    },
    pageHeaderIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: CLR.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pageTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: CLR.textPri,
        letterSpacing: -0.4,
    },
    pageSubtitle: {
        fontSize: 13,
        color: CLR.textMuted,
        marginTop: 2,
    },

    form: { gap: 16 },
    card: { padding: 20 },

    // ── Section headers
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        marginBottom: 18,
        paddingBottom: 14,
        borderBottomWidth: 1,
        borderBottomColor: CLR.borderLight,
    },
    sectionIconWrap: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: CLR.primaryTint,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: CLR.textPri,
        lineHeight: 20,
    },
    sectionSubtitle: {
        fontSize: 12,
        color: CLR.textMuted,
        marginTop: 2,
    },

    field: { marginBottom: 16 },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: CLR.textPri,
        marginBottom: 7,
    },
    hint: {
        fontSize: 12,
        color: CLR.textMuted,
        marginTop: 4,
        lineHeight: 17,
    },

    // ── Textarea
    symptomsInput: {
        backgroundColor: CLR.bg,
        borderRadius: 12,
        padding: 14,
        height: 90,
        textAlignVertical: 'top',
        fontSize: 15,
        borderWidth: 1,
        borderColor: CLR.border,
        color: CLR.textPri,
        lineHeight: 22,
        marginTop: 2,
    },
    textarea: {
        backgroundColor: CLR.bg,
        borderRadius: 12,
        padding: 14,
        height: 110,
        textAlignVertical: 'top',
        fontSize: 15,
        borderWidth: 1,
        borderColor: CLR.border,
        color: CLR.textPri,
        lineHeight: 22,
    },

    // ── Input
    input: {
        backgroundColor: CLR.bg,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        borderWidth: 1,
        borderColor: CLR.border,
        color: CLR.textPri,
        flex: 1,
    },
    inputWithIcon: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: CLR.bg,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: CLR.border,
        overflow: 'hidden',
    },
    inputIcon: {
        marginLeft: 14,
        marginRight: 2,
    },
    inputIconPadding: {
        borderWidth: 0,
        backgroundColor: 'transparent',
        flex: 1,
    },
    inputError: {
        borderColor: CLR.danger,
        borderWidth: 1.5,
    },
    fieldError: {
        fontSize: 12,
        color: CLR.danger,
        marginTop: 4,
    },

    // ── Severity
    severityRow: {
        flexDirection: 'row',
        gap: 8,
    },
    severityCard: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: CLR.border,
        backgroundColor: CLR.bg,
        gap: 4,
    },
    severityLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: CLR.textSec,
    },

    // ── Chips
    chipWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: CLR.border,
        backgroundColor: CLR.bg,
    },
    chipActive: {
        backgroundColor: CLR.primary,
        borderColor: CLR.primary,
    },
    chipText: {
        fontSize: 13,
        color: CLR.textSec,
        fontWeight: '500',
    },
    chipTextActive: {
        color: '#fff',
        fontWeight: '700',
    },


    // ── Image upload
    imageSection: { gap: 10 },
    imageGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    imageThumbWrap: {
        width: 80,
        height: 80,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
    },
    imageThumb: {
        width: '100%',
        height: '100%',
    },
    imageRemoveBtn: {
        position: 'absolute',
        top: 4,
        right: 4,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: 'rgba(0,0,0,0.6)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    imageAddBtn: {
        width: 80,
        height: 80,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: CLR.primary,
        borderStyle: 'dashed',
        backgroundColor: CLR.primary + '08',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
    },
    imageAddText: {
        fontSize: 11,
        fontWeight: '700',
        color: CLR.primary,
    },
    imageAddSub: {
        fontSize: 10,
        color: CLR.textMuted,
    },
    imageHint: {
        fontSize: 11,
        color: CLR.textMuted,
        lineHeight: 16,
    },

    // ── Submit
    submitWrap: { alignItems: 'stretch' },
    submitBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 16,
        ...Platform.select({
            web: {
                backgroundImage: `linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)`,
                boxShadow: '0 4px 15px rgba(99,102,241,0.4)',
            },
            default: { backgroundColor: CLR.primary },
        }),
    },
    submitBtnDisabled: { opacity: 0.45 },
    submitText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },

    // ── Emergency tip
    emergencyTip: {
        flexDirection: 'row',
        backgroundColor: CLR.danger + '0F',
        padding: 16,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: CLR.danger + '25',
        alignItems: 'flex-start',
    },
    tipIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: CLR.danger + '15',
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default ComplaintView;

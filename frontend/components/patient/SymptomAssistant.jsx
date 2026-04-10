import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { CLR, TY, SP, SHADOW } from '../../constants/DesignTokens';

const SUGGESTIONS = [
    'Fever', 'Dry Cough', 'Fatigue', 'Loss of taste', 'Sore throat',
    'Headache', 'Muscle pain', 'Chills', 'Nausea', 'Running nose',
    'Shortness of breath', 'Chest pain', 'Severe bleeding', 'Dizziness', 'Persistent vomiting'
];

const CRITICAL_SYMPTOMS = ['Chest pain', 'Shortness of breath', 'Severe bleeding', 'Unconsciousness'];

const SymptomAssistant = ({ onSymptomsChange, initialValue = '' }) => {
    const [query, setQuery] = useState('');
    const [selected, setSelected] = useState(initialValue ? initialValue.split(',').map(s => s.trim()) : []);
    const [isCritical, setIsCritical] = useState(false);

    useEffect(() => {
        const hasCritical = selected.some(s => CRITICAL_SYMPTOMS.includes(s));
        setIsCritical(hasCritical);
        onSymptomsChange(selected.join(', '));
    }, [selected]);

    const addSymptom = (s) => {
        if (!selected.includes(s)) {
            setSelected([...selected, s]);
        }
        setQuery('');
    };

    const removeSymptom = (s) => {
        setSelected(selected.filter(item => item !== s));
    };

    const suggestions = SUGGESTIONS.filter(s =>
        s.toLowerCase().includes(query.toLowerCase()) && !selected.includes(s)
    );

    return (
        <View style={styles.container}>
            <View style={styles.inputContainer}>
                <Feather name="search" size={16} color={CLR.textMuted} style={{ marginRight: 8 }} />
                <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Search or type symptoms..."
                    value={query}
                    onChangeText={setQuery}
                    onSubmitEditing={() => query && addSymptom(query)}
                />
            </View>

            {query.length > 0 && suggestions.length > 0 && (
                <View style={[styles.suggestions, SHADOW.md]}>
                    <FlatList
                        data={suggestions}
                        keyExtractor={item => item}
                        renderItem={({ item }) => (
                            <TouchableOpacity style={styles.suggestionItem} onPress={() => addSymptom(item)}>
                                <Text style={TY.body}>{item}</Text>
                                {CRITICAL_SYMPTOMS.includes(item) && (
                                    <View style={styles.critBadge}>
                                        <Text style={styles.critText}>Emergency</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        )}
                        keyboardShouldPersistTaps="always"
                    />
                </View>
            )}

            <View style={styles.tagList}>
                {selected.map(s => (
                    <View key={s} style={[
                        styles.tag,
                        CRITICAL_SYMPTOMS.includes(s) && styles.criticalTag
                    ]}>
                        <Text style={[
                            styles.tagText,
                            CRITICAL_SYMPTOMS.includes(s) && { color: '#fff' }
                        ]}>{s}</Text>
                        <TouchableOpacity onPress={() => removeSymptom(s)} style={{ marginLeft: 6 }}>
                            <Feather name="x" size={14} color={CRITICAL_SYMPTOMS.includes(s) ? '#fff' : CLR.textSec} />
                        </TouchableOpacity>
                    </View>
                ))}
            </View>

            {isCritical && (
                <View style={styles.warningBox}>
                    <Feather name="alert-triangle" size={18} color={CLR.danger} />
                    <View style={{ marginLeft: 10 }}>
                        <Text style={[TY.bodySemi, { color: CLR.danger }]}>Critical Condition Detected</Text>
                        <Text style={[TY.caption, { color: CLR.danger }]}>
                            Detected severe symptoms. We recommend immediate submission with Emergency Mode.
                        </Text>
                    </View>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        zIndex: 50,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: CLR.border,
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 48,
        backgroundColor: '#fff',
    },
    input: {
        fontSize: 15,
        color: CLR.textPri,
    },
    suggestions: {
        position: 'absolute',
        top: 52,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: CLR.border,
        maxHeight: 200,
        zIndex: 100,
    },
    suggestionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: CLR.borderLight,
    },
    tagList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 12,
    },
    tag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: CLR.status.ASSIGNED.bg,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    tagText: {
        fontSize: 13,
        fontWeight: '600',
        color: CLR.status.ASSIGNED.txt,
    },
    criticalTag: {
        backgroundColor: CLR.danger,
    },
    critBadge: {
        backgroundColor: CLR.danger + '20',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    critText: {
        fontSize: 10,
        color: CLR.danger,
        fontWeight: '700',
    },
    warningBox: {
        flexDirection: 'row',
        backgroundColor: '#FEF2F2',
        padding: 12,
        borderRadius: 12,
        marginTop: 16,
        borderWidth: 1,
        borderColor: CLR.danger + '40',
        alignItems: 'center',
    },
});

export default SymptomAssistant;

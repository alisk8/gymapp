import React, { useState, useEffect } from 'react';
import { View, Text, Button, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { db, firebase_auth } from '../../firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { useWorkout } from '../contexts/WorkoutContext';

const TemplateScreen = () => {
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const navigation = useNavigation();
    const { setWorkout } = useWorkout();

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        if (!firebase_auth.currentUser) return;

        const userId = firebase_auth.currentUser.uid;
        const templateRef = collection(db, "userProfiles", userId, "templates");
        const querySnapshot = await getDocs(templateRef);
        const templatesList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTemplates(templatesList);
    };

    const handleLoadTemplate = () => {
        if (selectedTemplate) {
            setWorkout({ exercises: selectedTemplate.exercises });
            navigation.navigate('WorkoutLog', { template: selectedTemplate });
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Select a Template</Text>
                <Picker
                    selectedValue={selectedTemplate}
                    onValueChange={(itemValue) => setSelectedTemplate(itemValue)}
                    style={styles.picker}
                >
                    <Picker.Item label="Select a template..." value={null} />
                    {templates.map(template => (
                        <Picker.Item key={template.id} label={template.templateName} value={template} />
                    ))}
                </Picker>

                {selectedTemplate && selectedTemplate.exercises && (
                    <View style={styles.templatePreview}>
                        <Text style={styles.previewTitle}>Template Preview:</Text>
                        {selectedTemplate.exercises.map((exercise, index) => (
                            <View key={index} style={styles.previewItem}>
                                <Text style={styles.previewItemText}>
                                    {exercise.name} - Sets: {exercise.setsCount}
                                </Text>
                                {exercise.supersets.length > 0 && (
                                    <View style={styles.supersetContainer}>
                                        <Text style={styles.supersetTitle}>Supersets:</Text>
                                        {exercise.supersets.map((superset, supersetIndex) => (
                                            <Text key={supersetIndex} style={styles.supersetItemText}>
                                                {superset.name} - Sets: {superset.setsCount}
                                            </Text>
                                        ))}
                                    </View>
                                )}
                            </View>
                        ))}
                    </View>
                )}

                <Button title="Load Template" onPress={handleLoadTemplate} disabled={!selectedTemplate} />
                <Button title="Start New Workout" onPress={() => navigation.navigate('WorkoutLog')} />
                <Button title="Cancel" onPress={() => navigation.goBack()} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    content: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
        width: '80%',
    },
    title: {
        fontSize: 20,
        marginBottom: 10,
    },
    picker: {
        width: '100%',
        marginBottom: 20,
    },
    templatePreview: {
        marginBottom: 20,
        width: '100%',
    },
    previewTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    previewItem: {
        marginBottom: 10,
    },
    previewItemText: {
        fontSize: 16,
    },
    supersetContainer: {
        marginLeft: 10,
        marginTop: 5,
    },
    supersetTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    supersetItemText: {
        fontSize: 14,
        marginTop: 2,
    },
});

export default TemplateScreen;

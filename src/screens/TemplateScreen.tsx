import React, { useState, useEffect } from 'react';
import { View, Text, Button, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { db, firebase_auth } from '../../firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { useWorkout } from '../contexts/WorkoutContext';

const TemplateScreen = ({ route }) => {
    const { setWorkout } = useWorkout();
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const navigation = useNavigation();

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        if (!firebase_auth.currentUser) return;

        try {
            const userId = firebase_auth.currentUser.uid;
            const templateRef = collection(db, "userProfiles", userId, "templates");
            const querySnapshot = await getDocs(templateRef);
            const templatesList = querySnapshot.docs.map(doc => {
                const data = doc.data();
                console.log('Fetched Template Data:', JSON.stringify(data, null, 2));
                return { id: doc.id, ...data };
            });

            setTemplates(templatesList);
        } catch (error) {
            console.error('Error fetching templates:', error);
        }
    };

    const handleLoadTemplate = () => {
        if (selectedTemplate) {
            console.log('Selected Template:', JSON.stringify(selectedTemplate, null, 2));

            if (selectedTemplate.exercises) {
                console.log('Exercises:', JSON.stringify(selectedTemplate.exercises, null, 2));
            } else {
                console.log('No exercises found in the selected template');
            }

            setWorkout({ exercises: selectedTemplate.exercises });
            navigation.navigate('WorkoutLog', { template: selectedTemplate });
        } else {
            console.log('No template selected');
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Select a Template</Text>
                <FlatList
                    data={templates}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => (
                        <TouchableOpacity onPress={() => setSelectedTemplate(item)}>
                            <Text style={styles.templateItem}>{item.templateName}</Text>
                        </TouchableOpacity>
                    )}
                />
                {selectedTemplate && selectedTemplate.exercises && (
                    <View style={styles.templatePreview}>
                        <Text style={styles.previewTitle}>Template Preview:</Text>
                        {selectedTemplate.exercises.map((exercise, index) => (
                            <View key={index} style={styles.previewItem}>
                                <Text style={styles.previewItemText}>
                                    {exercise.name} - Sets: {exercise.setsCount}
                                </Text>
                                {exercise.supersets && exercise.supersets.length > 0 && (
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
                <Button title="Load Template" onPress={handleLoadTemplate} />
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
    },
    title: {
        fontSize: 20,
        marginBottom: 10,
    },
    templateItem: {
        fontSize: 16,
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
    },
    templatePreview: {
        marginTop: 20,
    },
    previewTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    previewItem: {
        marginTop: 10,
    },
    previewItemText: {
        fontSize: 16,
    },
    supersetContainer: {
        marginTop: 10,
        paddingLeft: 10,
        borderLeftWidth: 2,
        borderLeftColor: '#ccc',
    },
    supersetTitle: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    supersetItemText: {
        fontSize: 14,
    },
});

export default TemplateScreen;

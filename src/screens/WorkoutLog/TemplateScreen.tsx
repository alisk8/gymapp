import React, {useState, useEffect, useCallback} from 'react';
import {View, Text, Button, FlatList, StyleSheet, ScrollView, Alert} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { db, firebase_auth } from '../../../firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import { useWorkout } from '../../contexts/WorkoutContext';

const TemplateScreen = ({ route }) => {
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState([]);
    const navigation = useNavigation();
    const [previousScreen, setPreviousScreen] = useState(null);
    const {workoutState, setWorkoutState, resetWorkout, handleWorkoutMode} = useWorkout();


    useEffect(() => {
        fetchTemplates();
        const unsubscribe = navigation.addListener('focus', () => {
            setPreviousScreen(route.params?.previousScreen || null);
        });

        return unsubscribe;
    }, []);


    const fetchTemplates = async () => {
        if (!firebase_auth.currentUser) return;

        try {
            const userId = firebase_auth.currentUser.uid;
            const templateRef = collection(db, "userProfiles", userId, "templates");
            const querySnapshot = await getDocs(templateRef);
            const templatesList = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return { id: doc.id, label: data.templateName, value: doc.id, ...data };
            });

            setTemplates(templatesList);
            setItems(templatesList.map(template => ({ label: template.templateName, value: template.id })));
        } catch (error) {
            console.error('Error fetching templates:', error);
        }
    };

    const handleLoadTemplate = () => {
        const selected = templates.find(template => template.id === selectedTemplate);
        if (selected) {
            navigation.navigate('WorkoutLog', { template: selected, previousScreen});
        } else {
            Alert.alert('No template selected');
        }
    };

    const startNewWorkout = () => {
          navigation.navigate('WorkoutLog', {previousScreen});
    }

    const renderExercise = (exercise, exercises) => {
        const sets = exercise.setsKeys.filter((setKey) => !setKey.includes('_dropset')).length;
        const dropSets = exercise.setsKeys.filter((setKey) => setKey.includes('_dropset')).length;

        return(
            <View key={exercise.id} style={exercise.isSuperset ? styles.supersetContainer : styles.previewItem}>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <Text style={styles.setsCount}>Sets: {sets}</Text>
                {dropSets > 0 && (
                    <Text style={styles.setItem}>
                        Drop Sets: {dropSets}
                    </Text>
                )}
                {exercise.isSuperset && exercises.find(ex => ex.id === exercise.supersetExercise) &&
                    renderExercise(exercises.find(ex => ex.id === exercise.supersetExercise), exercises)}
            </View>
        )};

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Select a Template</Text>
            <DropDownPicker
                open={open}
                value={selectedTemplate}
                items={items}
                setOpen={setOpen}
                setValue={setSelectedTemplate}
                setItems={setItems}
                placeholder="Select a template"
                containerStyle={styles.dropdownContainer}
                style={styles.dropdown}
                dropDownStyle={styles.dropdown}
            />
            {selectedTemplate && (
                <ScrollView style={styles.templatePreview}>
                    <Text style={styles.previewTitle}>Template Preview:</Text>
                    <ScrollView style={styles.templatePreview}>
                        {templates.find(template => template.id === selectedTemplate)?.exercises.map((exercise, index, exercises) => {
                            if (!exercise.isSuperset) {
                                return renderExercise(exercise, exercises);
                            }
                            return null;
                        })}
                    </ScrollView>
                </ScrollView>
            )}


            <Button title="Load Template" color='#016e03' onPress={handleLoadTemplate} />
            <Button title="Start New Workout" color='#016e03' onPress={startNewWorkout} />
            <Button title="Cancel" color='#CE2029' onPress={() => navigation.goBack()} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: 'white',
    },
    title: {
        paddingTop: 40,
        paddingBottom: 20,
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    dropdownContainer: {
        marginBottom: 20,
    },
    dropdown: {
        backgroundColor: '#fafafa',
    },
    templatePreview: {
        marginTop: 20,
        maxHeight: '90%',
        paddingHorizontal: 10,
    },
    previewTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    previewItem: {
        marginBottom: 15,
        backgroundColor: '#f0f0f0',
        padding: 10,
        borderRadius: 5,
    },
    exerciseName: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    setsCount: {
        fontSize: 16,
        marginTop: 5,
    },
    supersetContainer: {
        marginTop: 10,
        paddingLeft: 10,
        borderLeftWidth: 2,
        borderLeftColor: '#ccc',
    },
    supersetTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    supersetItemText: {
        fontSize: 16,
        marginTop: 5,
    },
    setItem: {
        fontSize: 16,
        marginTop: 5,
        paddingLeft: 10,
    },
    supersetItem: {
        marginTop: 10,
    },
});

export default TemplateScreen;


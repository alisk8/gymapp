import React, {useState, useEffect, useCallback} from 'react';
import {View, Text, Button, FlatList, StyleSheet, ScrollView, TextInput} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { db, firebase_auth } from '../../../firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import { useWorkout } from '../../contexts/WorkoutContext';
import axios from 'axios';

const EditTemplateScreen = ({ route }) => {
    const selectedTemplate = route.params?.template;
    const [userGoal, setUserGoal] = useState('');  // State to store the user goal
    const [feedback, setFeedback] = useState('');  // State to store the feedback from the server


    const preprocessTemplate = (template) => {
        let result = '';

        template.exercises.forEach((exercise) => {
            const setsCount = exercise.setsKeys.filter((setKey) => !setKey.includes('_dropset')).length;
            const dropSetsCount = exercise.setsKeys.filter((setKey) => setKey.includes('_dropset')).length;
            let exerciseDescription = `${exercise.name}: ${setsCount} sets`;

            if (dropSetsCount > 0) {
                exerciseDescription += `, ${dropSetsCount} drop sets`;
            }

            if (exercise.isSuperset && exercise.supersetExercise) {
                const supersetExercise = template.exercises.find(ex => ex.id === exercise.supersetExercise);
                if (supersetExercise) {
                    const supersetSetsCount = supersetExercise.setsKeys.filter((setKey) => !setKey.includes('_dropset')).length;
                    const supersetDropSetsCount = supersetExercise.setsKeys.filter((setKey) => setKey.includes('_dropset')).length;
                    let supersetDescription = `${supersetExercise.name}: ${supersetSetsCount} sets`;

                    if (supersetDropSetsCount > 0) {
                        supersetDescription += `, ${supersetDropSetsCount} drop sets`;
                    }

                    exerciseDescription += ` (superset with ${supersetDescription})`;
                }
            }

            result += `${exerciseDescription}\n`;
        });

        return result.trim();
    };


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

    const sendWorkoutDetails = async () => {
        const templateToString = preprocessTemplate(selectedTemplate);

        try {
            const response = await axios.post('http://192.168.9.39:8000/generate/', {
                workout_template: templateToString,
                user_goal: userGoal
            });

            const feedback = response.data.response.content;
            console.log('LLM Feedback:', feedback);
            setFeedback(feedback);
        } catch (error) {
            console.error('Error:', error);
            return null;
        }
    };


    return (
        <View style={styles.container}>
            {selectedTemplate && (
                <ScrollView style={styles.templatePreview}>
                    <Text style={styles.previewTitle}>Template Preview:</Text>
                    {selectedTemplate.exercises.map((exercise, index, exercises) => {
                        if (!exercise.isSuperset) {
                            return renderExercise(exercise, exercises);
                        }
                        return null;
                    })}
                </ScrollView>
            )}
            <TextInput
                style={styles.input}
                placeholder="Enter your goal"
                value={userGoal}
                onChangeText={setUserGoal}
            />
            <Button title="Get Feedback" onPress={sendWorkoutDetails} />
            {feedback !== '' && (
                <View style={styles.feedbackContainer}>
                    <Text style={styles.feedbackText}>Feedback:</Text>
                    <Text style={styles.feedbackContent}>{feedback}</Text>
                </View>
            )}
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
        maxHeight: '50%',
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
    input: {
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        borderRadius: 5,
        paddingHorizontal: 10,
        marginTop: 20,
        marginBottom: 20,
    },
    feedbackContainer: {
        marginTop: 20,
        padding: 10,
        backgroundColor: '#e0f7fa',
        borderRadius: 5,
    },
    feedbackText: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    feedbackContent: {
        fontSize: 16,
    },
});

export default EditTemplateScreen;


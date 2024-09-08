// FeedbackModal.js
import React, { useState } from 'react';
import { Modal, View, Text, TextInput, Button, StyleSheet } from 'react-native';
import axios from "axios/index";

const FeedbackModal = ({ visible, onClose, exercises, template }) => {
    const [userGoal, setUserGoal] = useState('');  // State to store the user goal
    const [feedback, setFeedback] = useState('');  // State to store the feedback from the server
    const [age, setAge] = useState(null);  // State for age
    const [yearsLifting, setYearsLifting] = useState('');  // State for years lifting
    const [muscleGroups, setMuscleGroups] = useState('');  // Sta
    const [injuryConcerns, setInjuryConcerns] = useState('');
    const preprocessTemplate = () => {
        let result = '';

        exercises.forEach((exercise) => {
            const sets = exercise.sets.filter((set) => !set.key.includes('_dropset'));  // Regular sets
            let totalSets = sets.length;
            let exerciseDescription = `${exercise.name}: ${totalSets} sets total`;

            // To store drop set info
            let dropSetDescriptions = [];

            // Iterate over each set to check for dropsets
            sets.forEach((set, setIndex) => {
                const dropSetsForThisSet = exercise.sets.filter((s) => s.key.includes(`${set.key}_dropset`));  // Dropsets for current set
                const dropSetCount = dropSetsForThisSet.length;

                if (dropSetCount > 0) {
                    dropSetDescriptions.push(`${dropSetCount} dropset${dropSetCount > 1 ? 's' : ''} for ${set.key.replace('set', 'set ')}`);
                }
            });

            // If there are dropset descriptions, add them to the result
            if (dropSetDescriptions.length > 0) {
                exerciseDescription += `, ${dropSetDescriptions.join(', ')}`;
            }

            // Add superset info if exists
            if (exercise.isSuperset && exercise.supersetExercise) {
                const supersetExercise = template.exercises.find(ex => ex.id === exercise.supersetExercise);
                exerciseDescription += ` (superset with ${supersetExercise.name})`;
            }

            result += `${exerciseDescription}\n`;
        });

        return result.trim();
    };


    const sendWorkoutDetails = async () => {
        const templateToString = preprocessTemplate();

        try {
            console.log('we here"');
            const response = await axios.post('http://192.168.68.71:8000/generate/', {
                workout_template: templateToString,
                user_goal: userGoal,
                age: age,
                gender: 'male',
                years_lifting: yearsLifting,
                goal_muscles: muscleGroups,
                prior_injuries: injuryConcerns,
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
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.modalContainer}>
                <View style={styles.modalContent}>

                    <Text style={styles.modalTitle}>Adapt my workout</Text>
                    <TextInput
                        style={styles.modalInput}
                        placeholder="Your age"
                        keyboardType="numeric"
                        value={age}
                        onChangeText={(text) => setAge(text)}
                    />

                    <TextInput
                        style={styles.modalInput}
                        placeholder="Years lifting"
                        keyboardType="numeric"
                        value={yearsLifting}
                        onChangeText={(text) => setYearsLifting(text)}
                    />

                    <TextInput
                        style={styles.modalInput}
                        placeholder="Target muscle groups"
                        value={muscleGroups}
                        onChangeText={(text) => setMuscleGroups(text)}
                    />
                    <TextInput
                        style={styles.modalInput}
                        placeholder="Any injury concerns?"
                        value={injuryConcerns}
                        onChangeText={(text) => setInjuryConcerns(text)}
                    />
                    <TextInput
                        style={styles.modalInput}
                        placeholder="Goals (strength, aesthetics etc.)"
                        value={userGoal}
                        onChangeText={(text) => setUserGoal(text)}
                    />
                    <View style={styles.modalButtons}>
                        <Button title="Submit" onPress={sendWorkoutDetails} />
                        <Button title="Cancel" onPress={onClose} />
                    </View>
                    {feedback !== '' && (
                        <View style={styles.feedbackContainer}>
                            <Text style={styles.feedbackText}>Feedback:</Text>
                            <Text style={styles.feedbackContent}>{feedback}</Text>
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        width: '80%',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 18,
        marginBottom: 10,
        fontWeight: 'bold',
    },
    modalInput: {
        width: '100%',
        padding: 10,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        marginBottom: 20,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
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

export default FeedbackModal;
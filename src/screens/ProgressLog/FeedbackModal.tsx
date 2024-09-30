// FeedbackModal.js
import React, {useEffect, useState} from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    Button,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    TouchableOpacity, Touchable
} from 'react-native';
import axios from "axios";

const FeedbackModal = ({ visible, onClose, exercises, template, useTemplateFeedback }) => {
    const [userGoal, setUserGoal] = useState('');  // State to store the user goal
    const [feedback, setFeedback] = useState('');  // State to store the feedback from the server
    const [age, setAge] = useState(null);  // State for age
    const [yearsLifting, setYearsLifting] = useState('');  // State for years lifting
    const [muscleGroups, setMuscleGroups] = useState('');  // Sta
    const [injuryConcerns, setInjuryConcerns] = useState('');
    const [loading, setLoading] = useState(false);
    const [newTemplate, setNewTemplate] = useState(template);

    const camelCase = (str) => {
        return str
            .replace(/\s(.)/g, function (match, group1) {
                return group1.toUpperCase();
            })
            .replace(/\s/g, '')
            .replace(/^(.)/, function (match, group1) {
                return group1.toLowerCase();
            });
    };

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
        setLoading(true);
        const templateToString = preprocessTemplate();

        try {

            const response = await axios.post('http://3.149.28.254:80/generate/', {
                workout_template: templateToString,
                user_goal: userGoal,
                age: age,
                gender: 'male',
                years_lifting: yearsLifting,
                goal_muscles: muscleGroups,
                prior_injuries: injuryConcerns,
            });

            const feedback = response.data;
            console.log('LLM Feedback:', response.data);
            setFeedback(feedback);
        } catch (error) {
            console.error('Error:', error);
            return null;
        } finally{
            setLoading(false);
        }
    };

    const handleSave = () => {
        useTemplateFeedback(newTemplate);  // Save newTemplate to the original screen's state
        onClose();  // Close the modal
    };

    const processWorkoutRoutine = (workoutString) => {
        // Split the workout string into individual exercise lines
        const exercisesArray = workoutString.split('\n').filter(line => line.trim() !== '');

        // Initialize a list to hold the exercises
        let processedExercises = [];

        // Iterate over each exercise line and process it
        exercisesArray.forEach(exerciseLine => {
            const match = exerciseLine.match(/^\d*\.\s*(.*?):\s*(\d+)\s*sets\s*total/i);
            if (match) {
                const exerciseName = match[1].trim();  // Extract the exercise name
                const totalSets = parseInt(match[2], 10);  // Extract the number of sets
                const setsKeys = Array.from({ length: totalSets }, (_, i) => `set${i + 1}`);  // Create setsKeys

                const supersetMatch = exerciseLine.match(/\(superset with (.*?)\)/i);
                const supersetExercise = supersetMatch ? supersetMatch[1].trim() : '';  // Check for superset exercise
                const isSuperset = !!supersetExercise;  // Boolean flag if it's a superset

                // Create the exercise object
                const exerciseObject = {
                    id: camelCase(exerciseName),
                    name: exerciseName,
                    setsKeys: setsKeys,
                    supersetExercise: supersetExercise,
                    isSuperset: isSuperset,
                };

                // Add the exercise object to the list
                processedExercises.push(exerciseObject);
            }
        });

        console.log(processedExercises);

        return processedExercises;
    };

    useEffect(() => {
        if(feedback){
            setNewTemplate((prevState) => ({
                ...prevState, // Copy the previous state
                exercises: processWorkoutRoutine(feedback) // Set the new exercises list
            }));        }
    }, [feedback]);


    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    <View style={styles.headerRow}>
                        <TouchableOpacity onPress={onClose}>
                            <Text style={styles.cancelButton}>Cancel</Text>
                        </TouchableOpacity>

                    </View>
                    <ScrollView contentContainerStyle={{alignItems: 'center', flex: 1, height: '95%'}}>
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
                        <Button title="Submit" onPress={sendWorkoutDetails} disabled={loading} />

                        {loading && <ActivityIndicator size="large" color="#0000ff" />}


                        {feedback !== '' && (
                         <View>
                            <View style={styles.feedbackContainer}>
                                <Text style={styles.feedbackText}>Feedback:</Text>
                                <Text style={styles.feedbackContent}>{feedback}</Text>
                            </View>
                             <View style={{flexDirection:'row', justifyContent:'center'}}>
                             <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
                                 <Text>Save</Text>
                             </TouchableOpacity>
                             </View>
                         </View>
                        )}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        width: '100%',
        height: '97%',
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
    headerRow: {
        flexDirection: "row",
        justifyContent: "flex-start",
        alignItems:"center",
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
    cancelButton: {
       color: 'black',
        fontSize: 16,
    },
    saveButton: {
    }
});

export default FeedbackModal;
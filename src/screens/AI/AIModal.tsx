import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
    ActivityIndicator,
    ScrollView, InteractionManager, Modal, Alert,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import axios from "axios";
import {db, firebase_auth} from "../../../firebaseConfig";
import {doc, getDoc} from "firebase/firestore";
import {useFocusEffect} from "@react-navigation/native";
import {FontAwesome5} from "@expo/vector-icons"; // Assuming you'll be using axios for API calls



const AIModal = ({ visible, onClose, exercises, template, useTemplateFeedback }) => {
    const [workoutDescription, setWorkoutDescription] = useState("");
    const [workoutDuration, setWorkoutDuration] = useState("");
    const [injuryConcerns, setInjuryConcerns] = useState("");
    const [loading, setLoading] = useState(false);
    const [feedback, setFeedback] = useState("");
    const [open, setOpen] = useState(false);
    const [selectedGoal, setSelectedGoal] = useState(null);
    const [items, setItems] = useState([
        { label: "Hypertrophy (Build Muscle/Aesthetics)", value: "Hypertrophy" },
        { label: "Strength", value: "Strength" },
        { label: "Rehabilitation", value: "Rehabilitation" },
        { label: "Cardio and Endurance", value: "Cardio and Endurance" },
        { label: "Flexibility and Mobility", value: "Flexibility and Mobility" },
        { label: "Other...", value: "Other" }
    ]);
    const [userProfile, setUserProfile] =useState(null);
    const [userProfileFetched, setUserProfileFetched] = useState(false);
    const [userAge, setUserAge] = useState("");
    const [yearsLifting, setYearsLifting] = useState("");
    const [goalMuscles, setGoalMuscles] = useState("");
    const [newTemplate, setNewTemplate] = useState([]);

    const fetchUserProfile = async () => {
        try {
            const currentUser = firebase_auth.currentUser;
            console.log('im in the func');
            if (currentUser) {
                const userRef = doc(db, "userProfiles", currentUser.uid);
                const userDoc = await getDoc(userRef);
                setUserProfile(userDoc.data());
                setUserProfileFetched(true);
            }
        } catch (error) {
            console.error("Error fetching user profile: ", error);
        }
    };

    useEffect(() => {
        console.log('im running');
        fetchUserProfile();
    }, []);


    useEffect(() => {

        if (userProfile && userProfileFetched) {
            const delay = setTimeout(() => {
                setUserAge(userProfile.age);
                setYearsLifting(userProfile.experienceLevel);
            }, 1000); // Delay of 1000 milliseconds (1 second)

            // Cleanup the timeout if the component is unmounted or userProfile changes
            return () => clearTimeout(delay);
        }
    }, [userProfile, userProfileFetched]);



    /**
    const handleBuildWorkout = async () => {
        setLoading(true);
        const workoutDetails = preprocessTemplate();

        try {
            // Example API call to get workout plan from AI
            const response = await axios.post("http://10.161.68.123:8082/generate/", {
                workout_template: workoutDetails,
                user_goal: selectedGoal,
                duration: workoutDuration,
                exercise_count: exerciseCount,
                description: workoutDescription,
            });
            const feedback = response.data;
            setFeedback(feedback);
        } catch (error) {
            console.error("Error fetching workout plan:", error);
        } finally {
            setLoading(false);
        }
    };
        **/

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

    useEffect(() => {
        if(feedback){
            setNewTemplate((prevState) => ({
                ...prevState, // Copy the previous state
                exercises: processWorkoutRoutine(feedback) // Set the new exercises list
            }));        }
    }, [feedback]);

    const handleSave = () => {
        console.log('new template saved', newTemplate);
        useTemplateFeedback(newTemplate);  // Save newTemplate to the original screen's state
        onClose();  // Close the modal
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
            const response = await axios.post('http://18.117.193.235:80/generate/', {
                workout_template: templateToString,
                user_goal: workoutDescription,
                age: userAge,
                gender: userProfile.sex,
                years_lifting: yearsLifting,
                goal_muscles: goalMuscles,
                prior_injuries: injuryConcerns,
                goal_workout_duration: workoutDuration,
            });

            const feedback = response.data;
            console.log('LLM Feedback:', response.data);
            setFeedback(feedback);
        } catch (error) {
            console.error('Error:', error);
            Alert.alert("Error generating workout. please try again later.");
            return null;
        } finally{
            setLoading(false);
        }
    };


    return (
        <Modal visible={visible} transparent animationType="slide">
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <ScrollView contentContainerStyle={styles.inner}>
                    <View style={styles.headerRow}>
                        <FontAwesome5
                            name="times"
                            onPress={onClose}
                            size={20}
                            color="black"
                            style={styles.cancelButton}
                        />
                    </View>
                    <Text style={styles.heading1}>
                        {exercises.length === 0? "Build a personalized" : "Customize your"} workout with AI
                    </Text>

                    <Text style={styles.note}>
                        Please fill in the details below, and we will {exercises.length === 0? "generate": "customize"} a workout
                        plan tailored to your needs.
                    </Text>
                    <View style={styles.topInputContainer}>
                        <TextInput
                            style={styles.muscleInput}
                            placeholder="Goal Muscles"
                            value={goalMuscles}
                            onChangeText={setGoalMuscles}
                            numberOfLines={1}
                            returnKeyType="done"
                            onSubmitEditing={Keyboard.dismiss}
                        />
                    </View>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Describe your workout goal: Strength, building muscle/aesthetics, Sport-specific training..."
                        value={workoutDescription}
                        onChangeText={setWorkoutDescription}
                        multiline={true}
                        numberOfLines={4}
                        returnKeyType="done"
                        onSubmitEditing={Keyboard.dismiss}
                    />

                    <View style={styles.bottomInputsContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Goal duration (mins)"
                            value={workoutDuration}
                            keyboardType="numeric"
                            onChangeText={setWorkoutDuration}
                            returnKeyType="done"
                            onSubmitEditing={Keyboard.dismiss}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Any injuries?"
                            value={injuryConcerns}
                            onChangeText={setInjuryConcerns}
                            returnKeyType="done"
                            onSubmitEditing={Keyboard.dismiss}
                        />
                    </View>

                    <TouchableOpacity style={styles.button} onPress={sendWorkoutDetails}>
                        <Text style={styles.buttonText}>{exercises.length === 0? 'Build': 'Customize'} workout</Text>
                    </TouchableOpacity>



                    {loading && <ActivityIndicator size="large" color="#0000ff" />}

                    {/* Feedback section */}
                    {feedback !== "" && (
                        <View style={styles.feedbackContainer}>
                            <Text style={styles.feedbackText}>
                                Your Personalized Workout Plan:
                            </Text>
                            <Text style={styles.feedbackContent}>{feedback}</Text>
                            <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
                                <Text style={styles.saveButtonText}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </ScrollView>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
        </Modal>
    );
};

export default AIModal;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    headerRow: {
        marginTop: 20,
        flexDirection: "row",
        alignItems:"center",
        justifyContent: "flex-start",
        width: '100%',
    },
    cancelButton: {
        color: 'black',
        fontSize: 16,
        padding: 5,
    },
    inner: {
        justifyContent: "center",
        alignItems: "center",
        padding: 16,
    },
    heading: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 16,
        textAlign: "center",
    },
    heading1: {
        paddingTop: 5,
        fontSize: 25,
        fontWeight: "bold",
        marginBottom: 20,
        textAlign: "center",
    },
    note: {
        fontSize: 14,
        color: "#666",
        textAlign: "center",
        marginBottom: 20,
    },
    dropdownContainer: {
        width: "100%",
        marginBottom: 20,
        zIndex: 10,
    },
    dropdown: {
        backgroundColor: "#fafafa",
        borderColor: "#ccc",
        borderWidth: 1,
        borderRadius: 8,
    },
    dropDownStyle: {
        backgroundColor: "#fafafa",
        borderColor: "#ccc",
    },
    searchInput: {
        width: "100%",
        height: 100,
        borderColor: "#ccc",
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 10,
        marginBottom: 20,
        textAlignVertical: "top",
    },
    bottomInputsContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 30,
        width: "100%",
    },
    topInputContainer: {
        flexDirection: "row",
        justifyContent: "center",
        marginBottom: 15,
        width: "100%",
    },
    muscleInput: {
        height: 50,
        flex: 1,
        borderColor: "#ccc",
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 10,
    },
    input: {
        flex: 1,
        height: 50,
        borderColor: "#ccc",
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 10,
        marginHorizontal: 5,
    },
    button: {
        backgroundColor: "#016e03",
        paddingVertical: 16,
        borderRadius: 25,
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
    },
    buttonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
    feedbackContainer: {
        marginTop: 20,
        padding: 10,
        backgroundColor: "#e0f7fa",
        borderRadius: 5,
        width: "100%",
    },
    feedbackText: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 5,
        textAlign: "center",
    },
    feedbackContent: {
        fontSize: 16,
        textAlign: "center",
    },
    saveButton: {
        backgroundColor: "#016e03", // A green color for the save button
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 25,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 10, // Adding some spacing above the button
    },
    saveButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
});
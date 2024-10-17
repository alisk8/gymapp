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
    ScrollView, InteractionManager,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import axios from "axios";
import {db, firebase_auth} from "../../../firebaseConfig";
import {doc, getDoc} from "firebase/firestore";
import {useFocusEffect} from "@react-navigation/native"; // Assuming you'll be using axios for API calls



const AIFrontPage = ({ navigation }) => {
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

    const handleBuildWorkout = async () => {
        setLoading(true);
        const templateToString = "";

        try {

            const response = await axios.post('http://127.0.0.1:8000/generate/', {
                workout_template: templateToString,
                user_goal: workoutDescription,
                age: userAge,
                gender: userProfile.sex,
                years_lifting: yearsLifting,
                goal_muscles: goalMuscles,
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


    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <ScrollView contentContainerStyle={styles.inner}>
                    <Text style={styles.heading1}>
                        Build a personalized workout with AI
                    </Text>

                    <Text style={styles.note}>
                        Please fill in the details below, and we will generate a workout
                        plan tailored to your needs.
                    </Text>

                    <Text style={styles.heading}>Describe your workout</Text>
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

                    <TouchableOpacity style={styles.button} onPress={handleBuildWorkout}>
                        <Text style={styles.buttonText}>Build me a workout plan</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.button} onPress={() => {navigation.goBack()}}>
                        <Text style={styles.buttonText}>Exit</Text>
                    </TouchableOpacity>


                    {loading && <ActivityIndicator size="large" color="#0000ff" />}

                    {/* Feedback section */}
                    {feedback !== "" && (
                        <View style={styles.feedbackContainer}>
                            <Text style={styles.feedbackText}>
                                Your Personalized Workout Plan:
                            </Text>
                            <Text style={styles.feedbackContent}>{feedback}</Text>
                        </View>
                    )}
                </ScrollView>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
};

export default AIFrontPage;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
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
});
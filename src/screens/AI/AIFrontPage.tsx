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
  ScrollView,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import axios from "axios"; // Assuming you'll be using axios for API calls

const AIFrontPage = ({ navigation }) => {
  const [workoutDescription, setWorkoutDescription] = useState("");
  const [workoutDuration, setWorkoutDuration] = useState("");
  const [exerciseCount, setExerciseCount] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [items, setItems] = useState([
    { label: "Muscle Building", value: "Muscle Building" },
    { label: "Weight Lifting", value: "Weight Lifting" },
    { label: "Rehabilitation", value: "Rehabilitation" },
    { label: "Cardio and Endurance", value: "Cardio and Endurance" },
    { label: "Flexibility and Mobility", value: "Flexibility and Mobility" },
  ]);

  // Function to process workout routine
  const preprocessTemplate = () => {
    // Example simple preprocessor to create a workout string based on the user's input
    let result = `Goal: ${selectedGoal}, Duration: ${workoutDuration} mins, Exercise Count: ${exerciseCount}`;
    if (workoutDescription) {
      result += `\nDescription: ${workoutDescription}`;
    }
    return result;
  };

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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={styles.inner}>
          <Text style={styles.heading1}>
            Use cutting-edge AI to build a personalized workout plan
          </Text>

          <Text style={styles.note}>
            Please fill in the details below, and we will generate a workout
            plan tailored to your needs.
          </Text>

          <Text style={styles.heading}>Describe your workout</Text>

          {/* Dropdown Picker */}
          <DropDownPicker
            open={open}
            value={selectedGoal}
            items={items}
            setOpen={setOpen}
            setValue={setSelectedGoal}
            setItems={setItems}
            placeholder="Select your workout goal"
            containerStyle={styles.dropdownContainer}
            style={styles.dropdown}
            dropDownContainerStyle={styles.dropDownStyle}
          />

          <TextInput
            style={styles.searchInput}
            placeholder="What would you like from your workout?"
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
              placeholder="Duration (mins)"
              value={workoutDuration}
              keyboardType="numeric"
              onChangeText={setWorkoutDuration}
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
            />
            <TextInput
              style={styles.input}
              placeholder="Exercises"
              value={exerciseCount}
              keyboardType="numeric"
              onChangeText={setExerciseCount}
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
            />
          </View>

          <TouchableOpacity style={styles.button} onPress={handleBuildWorkout}>
            <Text style={styles.buttonText}>Build me a workout plan</Text>
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

import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Alert,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { useFocusEffect } from "@react-navigation/native";
import { firebase_auth, db } from "../../../firebaseConfig";
import {
  doc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";

const Progress = ({ navigation }) => {
  const [allData, setAllData] = useState({
    diaryEntries: [],
    highlights: [],
    workouts: [],
  }); // Store all data here
  const [selectedDate, setSelectedDate] = useState(
    new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000)
      .toISOString()
      .split("T")[0]
  ); // Initialize with today's date adjusted for timezone
  const [diaryEntry, setDiaryEntry] = useState(""); // Diary entry input
  const [isDiaryModalVisible, setDiaryModalVisible] = useState(false); // Diary modal visibility
  const [currentDiaryId, setCurrentDiaryId] = useState(null); // Current diary entry ID for editing
  const [markedDates, setMarkedDates] = useState({}); // Dates with entries

  useFocusEffect(
    React.useCallback(() => {
      const currentDate = new Date();
      fetchAllData(currentDate);
    }, [])
  );

  // Fetch all data once and store in state
  const fetchAllData = async (date) => {
    const user = firebase_auth.currentUser;
    if (user) {
      const uid = user.uid;
      const userRef = doc(db, "userProfiles", uid);
      const diaryRef = collection(userRef, "diaryEntries");
      const highlightsRef = collection(userRef, "highlights");
      const workoutsRef = collection(userRef, "workouts");

      const marked = {};
      const allFetchedData = { diaryEntries: [], highlights: [], workouts: [] };

      // Fetch diary entries
      const diarySnapshot = await getDocs(diaryRef);
      diarySnapshot.forEach((doc) => {
        const entryDate = doc
          .data()
          .createdAt.toDate()
          .toISOString()
          .split("T")[0]; // UTC date
        marked[entryDate] = { marked: true, dotColor: "#016e03" };
        allFetchedData.diaryEntries.push({
          ...doc.data(),
          id: doc.id,
          date: entryDate,
        });
      });

      // Fetch highlights
      const highlightsSnapshot = await getDocs(highlightsRef);
      highlightsSnapshot.forEach((doc) => {
        const entryDate = doc
          .data()
          .createdAt.toDate()
          .toISOString()
          .split("T")[0]; // UTC date
        marked[entryDate] = { marked: true, dotColor: "#016e03" };
        allFetchedData.highlights.push({
          ...doc.data(),
          id: doc.id,
          date: entryDate,
        });
      });

      // Fetch workouts
      const workoutsSnapshot = await getDocs(workoutsRef);
      workoutsSnapshot.forEach((doc) => {
        const entryDate = doc
          .data()
          .createdAt.toDate()
          .toISOString()
          .split("T")[0]; // UTC date
        marked[entryDate] = { marked: true, dotColor: "#016e03" };
        allFetchedData.workouts.push({
          ...doc.data(),
          id: doc.id,
          date: entryDate,
        });
      });

      setAllData(allFetchedData);
      setMarkedDates(marked);
    } else {
      Alert.alert("Error", "No user is logged in");
    }
  };

  // Filter data by selected date
  const getFilteredDataForDate = (date) => {
    const filteredDiaryEntries = allData.diaryEntries.filter(
      (entry) => entry.date === date
    );
    const filteredHighlights = allData.highlights.filter(
      (highlight) => highlight.date === date
    );

    const filteredWorkouts = allData.workouts.filter(
      (workout) => workout.date === date
    );

    return { filteredDiaryEntries, filteredHighlights, filteredWorkouts };
  };

  // Open the diary modal
  const openDiaryModal = () => {
    if (!selectedDate) {
      Alert.alert("Error", "Please select a date to add a diary entry.");
      return;
    }
    setDiaryModalVisible(true);
  };

  // Save the diary entry to the selected date
  const handleSaveDiaryEntry = async () => {
    const user = firebase_auth.currentUser;
    if (user) {
      const uid = user.uid;
      const diaryRef = collection(db, "userProfiles", uid, "diaryEntries");

      try {
        const date = new Date(selectedDate); // Use selected date in UTC

        if (!currentDiaryId) {
          // Add a new diary entry for the selected date
          const docRef = await addDoc(diaryRef, {
            entry: diaryEntry,
            createdAt: Timestamp.fromDate(date), // Use selected date
          });
          Alert.alert("Success", "Diary entry added.");

          // Update local state with new diary entry
          setAllData((prevData) => ({
            ...prevData,
            diaryEntries: [
              ...prevData.diaryEntries,
              {
                entry: diaryEntry,
                id: docRef.id,
                date: date.toISOString().split("T")[0],
              },
            ],
          }));
        } else {
          // Update an existing diary entry
          const diaryEntryRef = doc(diaryRef, currentDiaryId);
          await updateDoc(diaryEntryRef, { entry: diaryEntry });
          Alert.alert("Success", "Diary entry updated.");

          // Update local state with updated diary entry
          setAllData((prevData) => ({
            ...prevData,
            diaryEntries: prevData.diaryEntries.map((entry) =>
              entry.id === currentDiaryId
                ? { ...entry, entry: diaryEntry }
                : entry
            ),
          }));
        }

        // Update markedDates
        setMarkedDates((prev) => ({
          ...prev,
          [selectedDate]: {
            marked: true,
            dotColor: "#016e03",
          },
        }));

        setDiaryModalVisible(false); // Close modal
        setDiaryEntry(""); // Clear diary entry
        setCurrentDiaryId(null); // Reset diary ID
      } catch (error) {
        console.error("Error saving diary entry:", error);
        Alert.alert("Error", "Failed to save diary entry. Please try again.");
      }
    } else {
      Alert.alert("Error", "No user is logged in.");
    }
  };

  const handleCancelDiaryEntry = () => {
    setDiaryEntry("");
    setCurrentDiaryId(null);
    setDiaryModalVisible(false);
  };

  // Render filtered data for the selected date
  const { filteredDiaryEntries, filteredHighlights, filteredWorkouts } =
    getFilteredDataForDate(selectedDate);

  // Render tracked exercises
  const handleExerciseClick = (exercise) => {
    navigation.navigate("TrackedExercise", { exercise, allData });
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={false}
          onRefresh={() => fetchAllData(new Date())}
        />
      }
    >
      <View style={styles.calenderContainer}>
        <Calendar
          onMonthChange={(month) => {
            const newDate = new Date(month.year, month.month - 1);
            fetchAllData(newDate);
          }}
          markedDates={{
            // Today's date style
            [new Date().toISOString().split("T")[0]]: {
              textColor: "#016e03",
            },

            // Conditionally apply selected date style if it's also a marked date
            [selectedDate]: {
              selected: true,
              selectedColor: "#016e03",
              ...((markedDates[selectedDate] && {
                // Merge marked date styles if it's selected
                marked: true,
                dotColor: "#016e03",
              }) ||
                {}),
            },

            // Apply marked dates for all other dates
            ...Object.keys(markedDates).reduce((acc, date) => {
              if (date !== selectedDate) {
                // Exclude the selected date
                acc[date] = {
                  ...markedDates[date],
                  marked: true,
                  dotColor: "#016e03",
                };
              }
              return acc;
            }, {}),
          }}
          onDayPress={(day) => {
            setSelectedDate(day.dateString);
          }}
        />
      </View>
      <TouchableOpacity style={styles.addDiaryButton} onPress={openDiaryModal}>
        <Ionicons name="book-outline" size={24} color="#016e03" />
      </TouchableOpacity>

      <View style={styles.detailsContainer}>
        {filteredHighlights.length > 0 && (
          <>
            <Text style={styles.subHeading}>Highlights:</Text>
            {filteredHighlights.map((highlight, index) => (
              <View key={index} style={styles.card}>
                <Text style={styles.detailText}>{highlight.detail}</Text>
              </View>
            ))}
          </>
        )}
        {filteredDiaryEntries.length > 0 && (
          <>
            <Text style={styles.subHeading}>Diary Entries:</Text>
            {filteredDiaryEntries.map((entry, index) => (
              <TouchableOpacity
                key={index}
                style={styles.card}
                onPress={() => {
                  setDiaryEntry(entry.entry);
                  setCurrentDiaryId(entry.id);
                  setDiaryModalVisible(true);
                }}
              >
                <View style={styles.diaryEntryContainer}>
                  <Text style={styles.detailText}>{entry.entry}</Text>
                  <Ionicons name="pencil" size={20} color="gray" />
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}
        {filteredWorkouts.length > 0 && (
          <>
            <Text style={styles.subHeading}>Workouts:</Text>
            {filteredWorkouts.map((workout, index) => (
              <View style={styles.workoutCard}>
                <Text style={styles.exerciseName}>
                  {workout.date} Workout {index + 1} {"\n"}
                </Text>
                {workout.exercises.map((exercise) => (
                  <Text>
                    {exercise.name}
                    {"\n"}
                    {"\n"}
                    {exercise.sets.map((set, setIndex) => (
                      <Text>
                        {" "}
                        Set {setIndex + 1}: {set.reps} reps, {set.weight}{" "}
                        {exercise.weightUnit}
                        {"\n"}
                      </Text>
                    ))}
                  </Text>
                ))}
              </View>
            ))}
          </>
        )}
        {filteredHighlights.length === 0 &&
          filteredDiaryEntries.length === 0 &&
          filteredWorkouts.length === 0 && (
            <Text style={styles.noEntriesText}>
              No highlights or diary entries found for this date.
            </Text>
          )}

        <Text style={styles.subHeading}>Exercises Tracker:</Text>
        <View style={styles.trackedExercisesContainer}>
          {allData.workouts.length > 0 ? (
            allData.workouts.map((workout, workoutIndex) =>
              workout.exercises.map((exercise, exerciseIndex) => (
                <TouchableOpacity
                  key={`${workoutIndex}-${exerciseIndex}`}
                  style={styles.trackedExerciseCard}
                  onPress={() => handleExerciseClick(exercise)}
                >
                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                </TouchableOpacity>
              ))
            )
          ) : (
            <Text style={styles.noEntriesText}>
              Complete a workout to see individual exercise progress.
            </Text>
          )}
        </View>
      </View>

      <Modal
        visible={isDiaryModalVisible}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {currentDiaryId ? "Edit Diary Entry" : "Add Diary Entry"}
            </Text>
            <Text style={styles.modalDateText}>Date: {selectedDate}</Text>
            <TextInput
              style={styles.diaryInput}
              value={diaryEntry}
              onChangeText={setDiaryEntry}
              placeholder="Write your diary entry here..."
              multiline
            />
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleSaveDiaryEntry}
            >
              <Text style={styles.modalButtonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleCancelDiaryEntry}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default Progress;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#fff",
  },
  calenderContainer: {
    paddingTop: 40,
  },
  detailsContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  subHeading: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#016e03",
    marginTop: 20,
    marginBottom: 10,
  },
  detailText: {
    fontSize: 16,
    color: "#555",
    marginBottom: 5,
  },
  noEntriesText: {
    fontSize: 16,
    color: "#555",
    textAlign: "left",
    marginTop: 10,
  },
  card: {
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    marginVertical: 5,
  },
  diaryEntryContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  addDiaryButton: {
    position: "absolute",
    right: 20,
    top: 15,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    width: "80%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
  },
  modalDateText: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  diaryInput: {
    width: "100%",
    height: 100,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    textAlignVertical: "top",
  },
  modalButton: {
    backgroundColor: "#016e03",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: "center",
    marginVertical: 10,
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  trackedExercisesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  trackedExerciseCard: {
    backgroundColor: "#e0f7fa",
    padding: 10,
    borderRadius: 10,
    margin: 5,
    alignItems: "center",
    width: "45%",
    justifyContent: "center",
  },
  exerciseName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
  },
  workoutCard: {
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    marginVertical: 5,
  },
});

import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Alert,
  RefreshControl,
  ScrollView,
  Modal,
  TextInput,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { useFocusEffect } from "@react-navigation/native";
import useMarkedDates from "../../../hooks/setMarkedDates";
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
  const [selectedDate, setSelectedDate] = useState("");
  const [highlights, setHighlights] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [diaryEntry, setDiaryEntry] = useState("");
  const [diaryModalVisible, setDiaryModalVisible] = useState(false);
  const [diaryEntries, setDiaryEntries] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [currentDiaryId, setCurrentDiaryId] = useState(null);
  const [trackModalVisible, setTrackModalVisible] = useState(false);
  const [customExerciseModalVisible, setCustomExerciseModalVisible] =
    useState(false);
  const [customExercise, setCustomExercise] = useState("");
  const [trackedExercises, setTrackedExercises] = useState([]);
  const [exercisePresets, setExercisePresets] = useState([]);
  const [searchText, setSearchText] = useState("");
  const { markedDates, loadMonthData, clearMarkedDates, setMarkedDates } =
    useMarkedDates();

  useFocusEffect(
    React.useCallback(() => {
      const currentDate = new Date();
      loadMonthData(currentDate);
      fetchTrackedExercises();
      fetchExercisePresets();
    }, [])
  );

  useEffect(() => {
    if (selectedDate) {
      fetchData(selectedDate);
    }
  }, [selectedDate]);

  useEffect(() => {
    const diaryDates = diaryEntries.map((entry) => entry.date);
    const marked = { ...markedDates };
    diaryDates.forEach((date) => {
      marked[date] = { selected: true, selectedColor: "green" };
    });
    setMarkedDates(marked);
  }, [diaryEntries]);

  const onRefresh = () => {
    const currentDate = new Date();
    loadMonthData(currentDate);
  };

  const fetchData = async (date) => {
    const user = firebase_auth.currentUser;
    if (user) {
      const uid = user.uid;
      const userRef = doc(db, "userProfiles", uid);

      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      const highlightsRef = collection(userRef, "highlights");
      const highlightsQuery = query(
        highlightsRef,
        where("createdAt", ">=", Timestamp.fromDate(startDate)),
        where("createdAt", "<=", Timestamp.fromDate(endDate))
      );
      const highlightsSnapshot = await getDocs(highlightsQuery);
      const highlightsData = highlightsSnapshot.docs.map((doc) => doc.data());

      const templatesRef = collection(userRef, "templates");
      const templatesQuery = query(
        templatesRef,
        where("createdAt", ">=", Timestamp.fromDate(startDate)),
        where("createdAt", "<=", Timestamp.fromDate(endDate))
      );
      const templatesSnapshot = await getDocs(templatesQuery);
      const templatesData = templatesSnapshot.docs.map((doc) => doc.data());

      const diaryRef = collection(userRef, "diaryEntries");
      const diaryQuery = query(
        diaryRef,
        where("createdAt", ">=", Timestamp.fromDate(startDate)),
        where("createdAt", "<=", Timestamp.fromDate(endDate))
      );
      const diarySnapshot = await getDocs(diaryQuery);
      const diaryData = diarySnapshot.docs.map((doc) => ({
        id: doc.id,
        entry: doc.data().entry,
        date: doc.data().createdAt.toDate().toISOString().split("T")[0],
      }));

      setHighlights(highlightsData);
      setTemplates(templatesData);
      setDiaryEntries(diaryData);

      const existingDiaryEntry = diaryData.find(
        (entry) => entry.date === selectedDate
      );
      if (existingDiaryEntry) {
        setDiaryEntry(existingDiaryEntry.entry);
        setCurrentDiaryId(existingDiaryEntry.id);
      } else {
        setDiaryEntry("");
        setCurrentDiaryId(null);
      }
    } else {
      Alert.alert("Error", "No user is logged in");
    }
  };

  const fetchTrackedExercises = async () => {
    const user = firebase_auth.currentUser;
    if (user) {
      const uid = user.uid;
      const userRef = doc(db, "userProfiles", uid);
      const trackedExercisesRef = collection(userRef, "trackedExercises");
      const snapshot = await getDocs(trackedExercisesRef);
      const exercises = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTrackedExercises(exercises);
    } else {
      Alert.alert("Error", "No user is logged in");
    }
  };

  const fetchExercisePresets = async () => {
    const presetsRef = collection(db, "exercisePresets");
    const snapshot = await getDocs(presetsRef);
    const exercises = snapshot.docs.map((doc) => doc.data());
    setExercisePresets(exercises);
  };

  const saveDiaryEntry = async () => {
    const user = firebase_auth.currentUser;
    if (user) {
      const uid = user.uid;
      const userRef = doc(db, "userProfiles", uid);
      const diaryRef = collection(userRef, "diaryEntries");

      if (currentDiaryId) {
        const diaryDocRef = doc(diaryRef, currentDiaryId);
        await updateDoc(diaryDocRef, {
          entry: diaryEntry,
          createdAt: Timestamp.fromDate(new Date(selectedDate)),
        });
      } else {
        await addDoc(diaryRef, {
          entry: diaryEntry,
          createdAt: Timestamp.fromDate(new Date(selectedDate)),
        });
      }

      setDiaryEntry("");
      setDiaryModalVisible(false);
      fetchData(selectedDate);
    } else {
      Alert.alert("Error", "No user is logged in");
    }
  };

  const handleTrackExercise = async (exercise) => {
    const user = firebase_auth.currentUser;
    if (user) {
      const uid = user.uid;
      const userRef = doc(db, "userProfiles", uid);
      const trackedExercisesRef = collection(userRef, "trackedExercises");

      await addDoc(trackedExercisesRef, {
        name: exercise.name,
        createdAt: Timestamp.fromDate(new Date()),
      });

      setTrackModalVisible(false);
      fetchTrackedExercises();
    } else {
      Alert.alert("Error", "No user is logged in");
    }
  };

  const filteredExercises = exercisePresets.filter((exercise) =>
    exercise.name.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Calendar
        onMonthChange={(month) => {
          const newDate = new Date(month.year, month.month - 1);
          loadMonthData(newDate);
        }}
        markedDates={markedDates}
        onDayPress={(day) => setSelectedDate(day.dateString)}
        theme={{
          selectedDayBackgroundColor: "#6A0DAD",
          todayTextColor: "#6A0DAD",
          arrowColor: "#6A0DAD",
          dotColor: "#6A0DAD",
          selectedDotColor: "#ffffff",
          monthTextColor: "#6A0DAD",
        }}
      />
      <View style={styles.detailsContainer}>
        <Text style={styles.heading}>Selected Date: {selectedDate}</Text>
        {highlights.length > 0 && (
          <>
            <Text style={styles.subHeading}>Highlights:</Text>
            {highlights.map((highlight, index) => (
              <View key={index} style={styles.card}>
                <Text style={styles.detailText}>{highlight.detail}</Text>
              </View>
            ))}
          </>
        )}
        {templates.length > 0 && (
          <>
            <Text style={styles.subHeading}>Workouts:</Text>
            {templates.map((template, index) => (
              <View key={index} style={styles.card}>
                <Text style={styles.workoutTitle}>{template.templateName}</Text>
                {template.exercises.map((exercise, idx) => (
                  <View key={idx} style={styles.exerciseContainer}>
                    <Text style={styles.exerciseName}>{exercise.name}</Text>
                    <Text style={styles.exerciseDetail}>
                      Sets: {exercise.setsCount}
                    </Text>
                    <Text style={styles.exerciseDetail}>
                      Weight Unit: {exercise.weightUnit}
                    </Text>
                  </View>
                ))}
              </View>
            ))}
          </>
        )}
        {diaryEntries.length > 0 && (
          <>
            <Text style={styles.subHeading}>Diary Entries:</Text>
            {diaryEntries.map((entry, index) => (
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
                  <TouchableOpacity
                    onPress={() => {
                      setDiaryEntry(entry.entry);
                      setCurrentDiaryId(entry.id);
                      setDiaryModalVisible(true);
                    }}
                  >
                    <Ionicons name="pencil" size={20} color="gray" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}
        {highlights.length === 0 &&
          templates.length === 0 &&
          diaryEntries.length === 0 && (
            <Text style={styles.noEntriesText}>
              No highlights, templates, or diary entries found for this date.
            </Text>
          )}
        {diaryEntries.length === 0 && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setDiaryModalVisible(true)}
          >
            <Text style={styles.addButtonText}>Add Diary Entry</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.trackButton}
          onPress={() => setTrackModalVisible(true)}
        >
          <Text style={styles.trackButtonText}>Track Analytics</Text>
        </TouchableOpacity>
        <Text style={styles.subHeading}>Tracked Exercises:</Text>
        <View style={styles.trackedExercisesContainer}>
          {trackedExercises.map((exercise, index) => (
            <TouchableOpacity
              key={index}
              style={styles.trackedExerciseCard}
              onPress={() =>
                navigation.navigate("TrackedExercise", { exercise })
              }
            >
              <Text style={styles.exerciseName}>{exercise.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <Modal
        animationType="slide"
        transparent={true}
        visible={diaryModalVisible}
        onRequestClose={() => setDiaryModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeading}>
              {currentDiaryId ? "Edit Diary Entry" : "Add Diary Entry"}
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder="Write your diary entry here..."
              value={diaryEntry}
              onChangeText={setDiaryEntry}
              multiline={true}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={saveDiaryEntry}
              >
                <Text style={styles.modalButtonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setDiaryModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Modal
        animationType="slide"
        transparent={true}
        visible={trackModalVisible}
        onRequestClose={() => setTrackModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeading}>Track Exercise</Text>
              <TouchableOpacity
                onPress={() => {
                  setTrackModalVisible(false);
                  setCustomExerciseModalVisible(true);
                }}
              >
                <Ionicons name="add" size={30} color="#6A0DAD" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.textInput}
              placeholder="Search for exercises..."
              value={searchText}
              onChangeText={setSearchText}
            />
            <FlatList
              data={filteredExercises}
              keyExtractor={(item) => item.name}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.exerciseItem}
                  onPress={() => handleTrackExercise(item)}
                >
                  <Text style={styles.exerciseName}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setTrackModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Modal
        animationType="slide"
        transparent={true}
        visible={customExerciseModalVisible}
        onRequestClose={() => setCustomExerciseModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeading}>Add Custom Exercise</Text>
            <TextInput
              style={styles.customTextInput}
              placeholder="Enter custom exercise"
              value={customExercise}
              onChangeText={setCustomExercise}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={async () => {
                  const user = firebase_auth.currentUser;
                  if (user) {
                    const uid = user.uid;
                    const userRef = doc(db, "userProfiles", uid);
                    const trackedExercisesRef = collection(
                      userRef,
                      "trackedExercises"
                    );

                    await addDoc(trackedExercisesRef, {
                      name: customExercise,
                      createdAt: Timestamp.fromDate(new Date()),
                    });

                    setCustomExercise("");
                    setCustomExerciseModalVisible(false);
                    setTrackModalVisible(false);
                    fetchTrackedExercises();
                  } else {
                    Alert.alert("Error", "No user is logged in");
                  }
                }}
              >
                <Text style={styles.modalButtonText}>Add</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setCustomExerciseModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
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
  detailsContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  heading: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
    textAlign: "center",
  },
  subHeading: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#6A0DAD",
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
    textAlign: "center",
    marginTop: 20,
  },
  workoutContainer: {
    marginBottom: 15,
  },
  workoutTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#6A0DAD",
    marginBottom: 5,
  },
  exerciseContainer: {
    marginLeft: 10,
    marginBottom: 5,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  exerciseDetail: {
    fontSize: 14,
    color: "#555",
  },
  addButton: {
    backgroundColor: "#6A0DAD",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: "center",
    marginVertical: 10,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  trackButton: {
    backgroundColor: "#32CD32",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: "center",
    marginVertical: 10,
  },
  trackButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
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
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: 300,
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    maxHeight: "80%",
    height: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalHeading: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#6A0DAD",
    textAlign: "center",
    marginBottom: 20,
  },
  textInput: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    marginBottom: 10,
    padding: 10,
    borderRadius: 5,
  },
  customTextInput: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    marginBottom: 10,
    padding: 10,
    borderRadius: 5,
  },
  modalButtons: {
    flexDirection: "row",
    marginTop: 20,
    justifyContent: "space-between",
  },
  modalButton: {
    backgroundColor: "#6A0DAD",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    width: "48%",
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
    width: "45%", // Adjust width for better layout
  },
  diaryEntryContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  exerciseItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
});

//       const uid = "X1Nx52EQsHbEOz5mQyVmFum704X2";

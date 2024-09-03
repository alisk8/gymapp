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
    const [selectedDate, setSelectedDate] = useState("");
    const [highlights, setHighlights] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [diaryEntries, setDiaryEntries] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [exercisesPerformed, setExercisesPerformed] = useState([]);
    const [markedDates, setMarkedDates] = useState({});
    const [diaryEntry, setDiaryEntry] = useState(""); // State for diary entry text
    const [isDiaryModalVisible, setDiaryModalVisible] = useState(false); // Modal visibility for diary entry
    const [currentDiaryId, setCurrentDiaryId] = useState(null); // State for current diary entry ID

    useFocusEffect(
        React.useCallback(() => {
            const currentDate = new Date();
            loadMonthData(currentDate);
            fetchAllWorkouts();
        }, [])
    );

    useEffect(() => {
        if (selectedDate) {
            fetchData(selectedDate);
        }
    }, [selectedDate]);

    const onRefresh = () => {
        const currentDate = new Date();
        loadMonthData(currentDate);
    };

    const loadMonthData = async (date) => {
        const user = firebase_auth.currentUser;
        if (user) {
            const uid = user.uid;
            const diaryRef = collection(db, "userProfiles", uid, "diaryEntries");
            const month = date.getMonth();
            const year = date.getFullYear();
            const startDate = new Date(year, month, 1);
            const endDate = new Date(year, month + 1, 0);

            const marked = {};
            const diaryQuery = query(
                diaryRef,
                where("createdAt", ">=", Timestamp.fromDate(startDate)),
                where("createdAt", "<=", Timestamp.fromDate(endDate))
            );

            const diarySnapshot = await getDocs(diaryQuery);
            diarySnapshot.forEach((doc) => {
                const entryDate = doc
                    .data()
                    .createdAt.toDate()
                    .toISOString()
                    .split("T")[0];
                marked[entryDate] = { selected: true, selectedColor: "green" };
            });

            setMarkedDates(marked);
        }
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
        } else {
            Alert.alert("Error", "No user is logged in");
        }
    };

    const fetchAllWorkouts = async () => {
        const user = firebase_auth.currentUser;
        if (user) {
            const uid = user.uid;
            const userRef = doc(db, "userProfiles", uid);
            const workoutsRef = collection(userRef, "workouts");
            const snapshot = await getDocs(workoutsRef);
            const workouts = snapshot.docs.map((doc) => doc.data());

            const allExercises = {};
            workouts.forEach((workout) => {
                workout.exercises.forEach((exercise) => {
                    if (!allExercises[exercise.id]) {
                        allExercises[exercise.id] = {
                            name: exercise.name,
                            data: [],
                        };
                    }
                    exercise.sets.forEach((set) => {
                        allExercises[exercise.id].data.push({
                            date: workout.createdAt.toDate(),
                            reps: set.reps,
                            weight: set.Weight,
                        });
                    });
                });
            });

            const exercisesArray = Object.values(allExercises);
            setExercisesPerformed(exercisesArray);
        } else {
            Alert.alert("Error", "No user is logged in");
        }
    };

    const handleExerciseClick = (exercise) => {
        navigation.navigate("TrackedExercise", { exercise });
    };

    const handleSaveDiaryEntry = async () => {
        const user = firebase_auth.currentUser;
        if (user) {
            const uid = user.uid;
            const diaryRef = collection(db, "userProfiles", uid, "diaryEntries");

            try {
                // Ensure selectedDate is a valid date
                if (!selectedDate) {
                    Alert.alert("Error", "Please select a date for the diary entry.");
                    return;
                }

                // Convert selectedDate to a Date object
                const date = new Date(selectedDate);
                if (isNaN(date.getTime())) {
                    Alert.alert("Error", "Selected date is invalid.");
                    return;
                }

                if (currentDiaryId) {
                    // Update existing diary entry
                    const diaryEntryRef = doc(diaryRef, currentDiaryId);
                    await updateDoc(diaryEntryRef, { entry: diaryEntry });
                    Alert.alert("Success", "Diary entry updated.");
                } else {
                    // Add new diary entry
                    await addDoc(diaryRef, {
                        entry: diaryEntry,
                        createdAt: Timestamp.fromDate(date), // Ensure date is valid
                    });
                    Alert.alert("Success", "Diary entry added.");
                }

                setDiaryModalVisible(false);
                fetchData(selectedDate);
                setDiaryEntry("");
                setCurrentDiaryId(null);
            } catch (error) {
                console.error("Error saving diary entry:", error);
                Alert.alert("Error", "Failed to save diary entry. Please try again.");
            }
        } else {
            Alert.alert("Error", "No user is logged in");
        }
    };

    const handleCancelDiaryEntry = () => {
        setDiaryEntry("");
        setCurrentDiaryId(null);
        setDiaryModalVisible(false);
    };

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
                                    <Ionicons name="pencil" size={20} color="gray" />
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
                <TouchableOpacity
                    style={styles.addDiaryButton}
                    onPress={() => setDiaryModalVisible(true)}
                >
                    <Text style={styles.addDiaryButtonText}>Add Diary Entry</Text>
                </TouchableOpacity>
                <Text style={styles.subHeading}>Progress Tracker:</Text>
                <View style={styles.trackedExercisesContainer}>
                    {exercisesPerformed.map((exercise, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.trackedExerciseCard}
                            onPress={() => handleExerciseClick(exercise)}
                        >
                            <Text style={styles.exerciseName}>{exercise.name}</Text>
                        </TouchableOpacity>
                    ))}
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
    },
    diaryEntryContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    addDiaryButton: {
        backgroundColor: "#6A0DAD",
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 25,
        alignItems: "center",
        marginVertical: 10,
    },
    addDiaryButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
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
        backgroundColor: "#6A0DAD",
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
});
import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet,
    View,
    Text,
    Dimensions,
    ScrollView,
    TouchableWithoutFeedback
} from 'react-native';
import { firebase_auth, db } from "../../../firebaseConfig";
import { useFocusEffect } from '@react-navigation/native';
import { collection, getDocs } from '@firebase/firestore';
import RNPickerSelect from 'react-native-picker-select';
import { LineChart } from 'react-native-chart-kit';
import exerciseLog from "./ExerciseLog";
import EditExerciseModal from './EditExerciseModal';
import {Ionicons} from "@expo/vector-icons"; // Import the modal


const screenWidth = Dimensions.get('window').width;

const TrackingExerciseScreen = ({route, navigation}) => {
    const exercise = route.params?.exercise;
    const [chartData, setChartData] = useState([]);
    const [selectedDataPoint, setSelectedDataPoint] = useState(null);
    const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
    const [exerciseEntries, setExerciseEntries] = useState([]);
    const [latestEntry, setLatestEntry] = useState(null);
    const [entryModalVisible, setEntryModalVisible] = useState(false); // State to control modal visibility


    useFocusEffect(
        useCallback(() => {
            const fetchExerciseData = async () => {
                if (!firebase_auth.currentUser) return;

                const userId = firebase_auth.currentUser.uid;
                const exerciseRef = collection(db, "userProfiles", userId, "exercises", exercise.id, "entries");

                const [entriesSnapshot] = await Promise.all([
                    getDocs(exerciseRef)
                ]);

                let entries = entriesSnapshot.docs.map(doc => doc.data());
                entries = entries.sort((a, b) => a.createdAt.toDate() - b.createdAt.toDate());

                const latestEntry = entries[entries.length - 1];

                setExerciseEntries(entries);
                setLatestEntry(latestEntry);
            };

            fetchExerciseData();

            // Optionally, return a cleanup function if needed
            return () => {
                // Clean up any subscriptions, listeners, etc., if necessary
            };
        }, [exercise.id]) // Dependencies array
    );

    useEffect(() => {
        // Set up the header with the + button
        navigation.setOptions({
            headerRight: () => (
                <TouchableWithoutFeedback onPress={() => setEntryModalVisible(true)}>
                    <View style={{ marginRight: 15 }}>
                        <Ionicons name="add-outline" size={24} color="black" />
                    </View>
                </TouchableWithoutFeedback>
            ),
        });
    }, [navigation, latestEntry]);

    useEffect(() => {
        if (exerciseEntries) {
            console.log("ENTRIES", exerciseEntries);
            const processEntryData = () => {

                // Map of best 1RM per date
                const predicted1RMPerDate = {};
                let latestEntry = null;

                exerciseEntries.forEach(entry => {
                        const date = entry.createdAt.toDate().toDateString(); // Convert to date string to use as a key
                        const weight = convertToPounds(entry.weight, entry.weightUnit);
                        const reps = entry.reps;
                        const oneRepMax = calculate1RM(entry.weight, entry.reps);

                        const entryDate = entry.createdAt.toDate();
                        // Update latestEntry with the most recent entry
                        if (!latestEntry || entryDate > latestEntry.createdAt) {
                            latestEntry = { weight, reps, oneRepMax, createdAt: entryDate};
                            console.log('LATEST',latestEntry);
                        }

                        if (!predicted1RMPerDate[date] || oneRepMax > predicted1RMPerDate[date].oneRepMax) {
                            predicted1RMPerDate[date] = { date: entry.createdAt.toDate(), weight, reps, oneRepMax };
                        }

                });

                setLatestEntry(latestEntry);
                return Object.values(predicted1RMPerDate);

            };

            const calculate1RM = (weight, reps) => {
                return weight * (1 + 0.0333 * reps);
            };

            const data = processEntryData();
            setChartData(data);


        }
    }, [exerciseEntries]);

    const convertToPounds = (weightNum, weightUnit) => {

        if (weightUnit === 'kgs') {
            return weightNum * 2.20462; // 1 kg = 2.20462 lbs
        }

        return weightNum; // assuming the unit is already in pounds
    };

    const handleDataPointClick = (data) => {
        const { index, x, y } = data;
        const dataPoint = chartData[index];
        setSelectedDataPoint(dataPoint);
        setPopupPosition({ x, y });
    };



    const handleOutsidePress = () => {
        setSelectedDataPoint(null);
    };

    return (
        <TouchableWithoutFeedback onPress={handleOutsidePress}>
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.headerText}>{exercise.name}</Text>
                <View style={styles.latestEntryContainer}>
                    {latestEntry && (
                        <>
                            <Text style={styles.latestEntryText}>
                                Latest: {latestEntry.weight} lbs x {latestEntry.reps} reps
                            </Text>
                            <Text style={styles.latestEntryText}>
                                Predicted 1RM: {latestEntry.oneRepMax.toFixed(2)} lbs
                            </Text>
                        </>
                    )}
                </View>
                    <View style={{ alignItems: 'center' }}>
                        <LineChart
                            data={{
                                labels: chartData.map(entry => entry.date.toLocaleDateString()),
                                datasets: [
                                    {
                                        data: chartData.map(entry => entry.oneRepMax),
                                        strokeWidth: 2
                                    }
                                ]
                            }}
                            width={screenWidth}
                            height={220}
                            chartConfig={{
                                backgroundColor: '#ffffff',
                                backgroundGradientFrom: '#ffffff',
                                backgroundGradientTo: '#ffffff',
                                decimalPlaces: 2,
                                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                                style: {
                                    borderRadius: 16
                                }
                            }}
                            style={{
                                marginVertical: 8,
                                borderRadius: 16
                            }}
                            onDataPointClick={handleDataPointClick}
                        />
                        {selectedDataPoint && (
                            <View style={[styles.dataPointDetails, { top: popupPosition.y - 70, left: popupPosition.x - 50 }]}>
                                <Text style={styles.detailsText}>
                                    Date: {selectedDataPoint.date.toLocaleDateString()}
                                </Text>
                                <Text style={styles.detailsText}>
                                    Weight: {selectedDataPoint.weight} lbs
                                </Text>
                                <Text style={styles.detailsText}>
                                    Reps: {selectedDataPoint.reps}
                                </Text>
                            </View>
                        )}
                        <EditExerciseModal
                            isVisible={entryModalVisible}
                            onClose={() => setEntryModalVisible(false)}
                            selectedExercise={exercise.name}
                            latestAttempt={latestEntry}
                            refreshTrackedExercises={() => {}}
                        />
                    </View>
            </ScrollView>
        </TouchableWithoutFeedback>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: '#f8f9fa',
        flex: 1,
        alignItems: 'center'
    },
    headerText: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20
    },
    dataPointDetails: {
        position: 'absolute',
        padding: 10,
        backgroundColor: '#ffffff',
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
        width: 120,
        alignItems: 'center'
    },
    detailsText: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 5
    },
    latestEntryContainer: {
        alignItems: 'center',
        marginBottom: 10,
    },
    latestEntryText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
});

const pickerSelectStyles = StyleSheet.create({
    inputIOS: {
        fontSize: 16,
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderColor: 'gray',
        borderRadius: 4,
        color: 'black',
        paddingRight: 30,
        backgroundColor: '#fff',
        marginVertical: 10,
        width: screenWidth - 40,
    },
    inputAndroid: {
        fontSize: 16,
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderWidth: 0.5,
        borderColor: 'gray',
        borderRadius: 8,
        color: 'black',
        paddingRight: 30,
        backgroundColor: '#fff',
        marginVertical: 10,
        width: screenWidth - 40,
    },
});

export default TrackingExerciseScreen;